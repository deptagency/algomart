import pino from 'pino'
import {
  CreateBidRequest,
  EventAction,
  EventEntityType,
  NotificationType,
} from '@algomart/schemas'
import {
  BidModel,
  EventModel,
  PackModel,
  UserAccountModel,
} from '@algomart/shared/models'
import { userInvariant } from '@algomart/shared/utils'
import { NotificationsService, PacksService } from './'
import { Transaction } from 'objection'

export class BidsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly notifications: NotificationsService,
    private readonly packService: PacksService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async createBid(bid: CreateBidRequest, trx?: Transaction): Promise<boolean> {
    // Get and verify corresponding pack
    const pack = await PackModel.query(trx)
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
    const newHighBidder = await UserAccountModel.query(trx).findOne({
      externalId: bid.externalId || null,
    })

    userInvariant(
      newHighBidder,
      'new high bidder does not have a registered account',
      400
    )

    // Create new bid
    const { id: bidId } = await BidModel.query(trx).insert({
      amount: bid.amount,
      packId: bid.packId,
      userAccountId: newHighBidder.id,
    })
    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.Bid,
      entityId: bidId,
    })

    // Update pack with new activeBid
    await PackModel.query(trx).where('id', bid.packId).patch({
      activeBidId: bidId,
    })
    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityType: EventEntityType.Pack,
      entityId: bid.packId,
    })

    // Get the previous highest bidder
    const previousHighBidder = await UserAccountModel.query(trx).findOne({
      id: pack.activeBid?.userAccountId || null,
    })

    // Check if they're the same user as the new high bidder
    const biddersAreTheSame = previousHighBidder?.id === newHighBidder.id

    // Create an outbid notification
    if (previousHighBidder && !biddersAreTheSame) {
      const packWithBase = await this.packService.getPackById(
        bid.packId,
        previousHighBidder.language,
        trx
      )

      if (packWithBase) {
        await this.notifications.createNotification(
          {
            type: NotificationType.UserOutbid,
            userAccountId: previousHighBidder.id,
            variables: {
              packSlug: packWithBase.slug,
              packTitle: packWithBase.title,
            },
          },
          trx
        )
      }
    }

    // Create a new high bid notification
    if (!biddersAreTheSame) {
      const packWithBase = await this.packService.getPackById(
        bid.packId,
        newHighBidder.language,
        trx
      )
      if (packWithBase) {
        await this.notifications.createNotification(
          {
            type: NotificationType.UserHighBid,
            userAccountId: newHighBidder.id,
            variables: {
              packSlug: packWithBase.slug,
              packTitle: packWithBase.title,
            },
          },
          trx
        )
      }
    }

    return true
  }
}
