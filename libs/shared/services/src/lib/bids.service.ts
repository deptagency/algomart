import * as Currencies from '@dinero.js/currencies'
import pino from 'pino'
import {
  CreateBidRequest,
  EventAction,
  EventEntityType,
  NotificationType,
} from '@algomart/schemas'
import { Transaction } from 'objection'

import {
  UserAccountModel,
  BidModel,
  EventModel,
  PackModel,
} from '@algomart/shared/models'

import PacksService from './packs.service'
import NotificationsService from './notifications.service'
import { isGreaterThan, userInvariant } from '@algomart/shared/utils'
import I18nService from './i18n.service'
import { Knex } from 'knex'

// import { BidModel } from '@/models/bid.model'
// import { EventModel } from '@/models/event.model'
// import { PackModel } from '@/models/pack.model'
// import { UserAccountModel } from '@/models/user-account.model'
// import NotificationsService from '@/modules/notifications/notifications.service'
// import PacksService from '@/modules/packs/packs.service'
// import { currency, isGreaterThan } from '@/utils/format-currency'
// import { userInvariant } from '@/utils/invariant'

export default class BidsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly i18nService: I18nService,
    private readonly notifications: NotificationsService,
    private readonly packService: PacksService,
    private currency: Currencies.Currency<number>,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async createBid(
    bid: CreateBidRequest,
    trx?: Transaction,
    knexRead?: Knex
  ): Promise<boolean> {
    // Get and verify corresponding pack
    const pack = await PackModel.query(knexRead)
      .where('id', bid.packId)
      .withGraphFetched('activeBid')
      .first()
    userInvariant(pack, 'pack not found', 404)

    // Check if the active bid amount is lower than the new bid
    if (pack.activeBid) {
      userInvariant(
        isGreaterThan(bid.amount, pack.activeBid.amount, this.currency),
        'bid is not higher than the previous bid'
      )
    }

    // Bids are stored in currency of environment variable
    const { exchangeRate } = await this.i18nService.getCurrencyConversion(
      {
        sourceCurrency: bid.currency,
        targetCurrency: this.currency.code,
      },
      trx,
      knexRead
    )

    // Get user by externalId
    const newHighBidder = await UserAccountModel.query(knexRead).findOne({
      externalId: bid.externalId || null,
    })

    userInvariant(
      newHighBidder,
      'new high bidder does not have a registered account',
      400
    )

    // Create new bid
    const { id: bidId } = await BidModel.query(trx).insert({
      amount: bid.amount * exchangeRate,
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
    const previousHighBidder = await UserAccountModel.query(knexRead).findOne({
      id: pack.activeBid?.userAccountId || null,
    })

    // Check if they're the same user as the new high bidder
    const biddersAreTheSame = previousHighBidder?.id === newHighBidder.id

    // Create an outbid notification
    if (previousHighBidder && !biddersAreTheSame) {
      const packWithBase = await this.packService.getPackById(
        bid.packId,
        trx,
        previousHighBidder.locale
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
        trx,
        newHighBidder.locale
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
