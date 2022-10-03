import { CreateBidRequest, NotificationType } from '@algomart/schemas'
import { BidModel, PackModel, UserAccountModel } from '@algomart/shared/models'
import { userInvariant } from '@algomart/shared/utils'
import { Model } from 'objection'
import pino from 'pino'

import { NotificationsService, PacksService } from './'

export class BidsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly notifications: NotificationsService,
    private readonly packService: PacksService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  // TODO: is this safe in terms of race conditions?
  // do we need to add a DB level constraint/trigger?
  async createBid(bid: CreateBidRequest): Promise<boolean> {
    // Get and verify corresponding pack
    const pack = await PackModel.query()
      .where('id', bid.packId)
      .withGraphFetched('activeBid')
      .first()
    userInvariant(pack, 'pack not found', 404)

    // Check if the bid is greater than the active bid
    if (pack.activeBid) {
      userInvariant(
        bid.amount > pack.activeBid.amount,
        'bid is not higher than the previous bid'
      )
    }

    // Get user by externalId
    const newHighBidder = await UserAccountModel.query().findOne({
      externalId: bid.userExternalId || null,
    })

    userInvariant(
      newHighBidder,
      'new high bidder does not have a registered account',
      400
    )

    const trx = await Model.startTransaction()

    try {
      // Create new bid
      const { id: bidId } = await BidModel.query(trx).insert({
        amount: bid.amount,
        packId: bid.packId,
        userAccountId: newHighBidder.id,
      })

      // Update pack with new activeBid
      await PackModel.query(trx).where('id', bid.packId).patch({
        activeBidId: bidId,
      })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }

    // Get the previous highest bidder
    const previousHighBidder = await UserAccountModel.query().findOne({
      id: pack.activeBid?.userAccountId || null,
    })

    // Check if they're the same user as the new high bidder
    const biddersAreTheSame = previousHighBidder?.id === newHighBidder.id

    // Create an outbid notification
    if (previousHighBidder && !biddersAreTheSame) {
      const packWithBase = await this.packService.getPackById(
        bid.packId,
        previousHighBidder.language
      )

      if (packWithBase) {
        await this.notifications.createNotification({
          type: NotificationType.UserOutbid,
          userAccountId: previousHighBidder.id,
          variables: {
            packSlug: packWithBase.slug,
            packTitle: packWithBase.title,
          },
        })
      }
    }

    // Create a new high bid notification
    if (!biddersAreTheSame) {
      const packWithBase = await this.packService.getPackById(
        bid.packId,
        newHighBidder.language
      )
      if (packWithBase) {
        await this.notifications.createNotification({
          type: NotificationType.UserHighBid,
          userAccountId: newHighBidder.id,
          variables: {
            packSlug: packWithBase.slug,
            packTitle: packWithBase.title,
          },
        })
      }
    }

    return true
  }
}
