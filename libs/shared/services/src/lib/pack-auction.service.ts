import { NotificationType, PackBase } from '@algomart/schemas'
import { PackModel } from '@algomart/shared/models'
import { addDays, formatIntToFixed, invariant } from '@algomart/shared/utils'
import { Currency } from '@dinero.js/currencies'
import { Model } from 'objection'
import { Logger } from 'pino'

import { CMSCacheService } from './cms-cache.service'
import { NotificationsService } from './notifications.service'

const EXPIRE_BID_IN_DAYS = 3

export interface PackAuctionServiceOptions {
  currency: Currency<number>
}

export class PackAuctionService {
  constructor(
    private readonly options: PackAuctionServiceOptions,
    private readonly cms: CMSCacheService,
    private readonly notifications: NotificationsService,
    private readonly logger: Logger
  ) {}

  private async processCompletedPackAuction(
    templateId: string
  ): Promise<boolean> {
    const expiresAt = addDays(new Date(), EXPIRE_BID_IN_DAYS).toISOString()

    // Mark pack as "sold" by setting expiresAt
    const affectedRows = await PackModel.query()
      .where('templateId', templateId)
      .whereNull('expiresAt')
      .whereNull('ownerId')
      .whereNotNull('activeBidId')
      .patch({
        // Intentionally do not set ownerId, that will be set later after the bid payment is completed
        expiresAt,
      })

    // Pack already processed or has no valid bids, skip
    if (affectedRows === 0) return true

    try {
      // Only single pack available for auctions
      const pack = await PackModel.query()
        .where('templateId', templateId)
        .withGraphFetched('activeBid.userAccount')
        .first()

      // Sanity check pack was found with bid and user account
      invariant(
        pack?.activeBid?.userAccount,
        `Pack for template ${templateId} not found or has no active bid user account`
      )

      // Get pack template in user's preferred language
      const packTemplate = await this.cms.findPackByTemplateId(
        pack.templateId,
        pack.activeBid.userAccount.language
      )

      // Sanity check pack template was found
      invariant(packTemplate, 'packTemplate not found')

      // Send them a notification for the completed auction
      await this.notifications.createNotification({
        type: NotificationType.AuctionComplete,
        userAccountId: pack.activeBid.userAccount.id,
        variables: {
          amount: `${formatIntToFixed(
            pack.activeBid.amount,
            this.options.currency
          )}`,
          canExpire: packTemplate.allowBidExpiration,
          packSlug: packTemplate.slug,
          packTitle: packTemplate.title,
        },
      })

      return true
    } catch (error) {
      await PackModel.query().where('templateId', templateId).patch({
        expiresAt: null,
      })
      this.logger.error(error)
      return false
    }
  }

  async processRecentlyCompletedPackAuctions(): Promise<number> {
    const oneWeekAgo = addDays(new Date(), -7)
    const packTemplates = await this.cms.findAllPacksAuctionCompletion(
      oneWeekAgo
    )

    let count = 0

    for (const packTemplate of packTemplates) {
      if (await this.processCompletedPackAuction(packTemplate.templateId)) {
        count++
      }
    }

    return count
  }

  private getSubsequentBids(pack: PackModel, packTemplate: PackBase) {
    // If a user has bid on the pack multiple times, only consider their highest bid
    // This way, if a chain of expired bids occurs, a user doesn't have a second opportunity to win
    const existingBids = new Set<string>()
    const sanitizedBids = pack.bids
      .sort((a, b) => b.amount - a.amount)
      .filter((bid) => {
        if (bid.userAccount?.id) {
          if (existingBids.has(bid.userAccount.id)) return false
          existingBids.add(bid.userAccount.id)
          return true
        }
        return false
      })

    // Get next highest bidder, and exclude previous higher bids
    const subsequentBids = sanitizedBids.filter((b) => {
      return (
        // Don't get the active bid
        pack.activeBidId !== b.id &&
        // Get bids that are less than previously higher bids
        b.amount < (pack.activeBid?.amount || 0) &&
        // Get bids that are greater than or equal to the pack price
        b.amount >= packTemplate.price
      )
    })

    // Return the bids in descending order to ensure the next bid is the first in the list
    return subsequentBids.sort((a, b) => b.amount - a.amount)
  }

  private async processExpiredPackAuction(pack: PackModel): Promise<boolean> {
    const affectedRows = await PackModel.query()
      .findById(pack.id)
      .where('expiresAt', '<=', new Date())
      .whereNull('ownerId')
      .whereNotNull('activeBidId')
      .patch({
        // Clear out activeBidId to prevent further processing,
        // we will reset it or set a new one later as needed.
        activeBidId: null,
        expiresAt: null,
      })

    // Pack already processed or has no valid bids, skip
    if (affectedRows === 0) return true

    try {
      // Sanity check pack was found with bid and user account
      invariant(
        pack.activeBid?.userAccount,
        `Pack ${pack.id} not found or has no active bid user account`
      )
      invariant(pack.bids, `Pack ${pack.id} has no bids`)

      // Get pack template in user's preferred language
      const packTemplate = await this.cms.findPackByTemplateId(
        pack.templateId,
        pack.activeBid.userAccount.language
      )

      // Sanity check pack template was found
      invariant(packTemplate, `Pack template ${pack.templateId} not found`)

      const subsequentBids = this.getSubsequentBids(pack, packTemplate)

      if (subsequentBids.length === 0) {
        // No bids left, leave pack in expired state
      } else {
        const selectedBid = subsequentBids[0]
        invariant(
          selectedBid.userAccount,
          `Next highest bid for pack ${pack.id} has no associated user account`
        )

        // Get pack template again, but with next bidder's preferred language
        const packTemplate = await this.cms.findPackByTemplateId(
          pack.templateId,
          selectedBid.userAccount.language
        )
        invariant(packTemplate, `Pack template ${pack.templateId} not found`)

        const expiresAt = addDays(new Date(), EXPIRE_BID_IN_DAYS).toISOString()
        const trx = await Model.startTransaction()

        try {
          await PackModel.query(trx).findById(pack.id).patch({
            activeBidId: selectedBid.id,
            expiresAt,
          })

          await trx.commit()
        } catch (error) {
          await trx.rollback()
          throw error
        }

        // Send notification to next highest bidder
        await this.notifications.createNotification({
          type: NotificationType.AuctionComplete,
          userAccountId: selectedBid.userAccount.id,
          variables: {
            amount: `${formatIntToFixed(
              selectedBid.amount,
              this.options.currency
            )}`,
            canExpire: packTemplate.allowBidExpiration,
            packSlug: packTemplate.slug,
            packTitle: packTemplate.title,
          },
        })
      }

      // Send bid expiration notice to the previous high bidder
      await this.notifications.createNotification({
        type: NotificationType.BidExpired,
        userAccountId: pack.activeBid.userAccount.id,
        variables: {
          packTitle: packTemplate.title,
        },
      })

      return true
    } catch (error) {
      // Reset pack to allow retry
      // Note, there's a risk here we already sent out notifications, a retry
      // might send them out again.
      await PackModel.query().findById(pack.id).patch({
        activeBidId: pack.activeBidId,
        expiresAt: pack.expiresAt,
      })
      this.logger.error(error)
      return false
    }
  }

  async processExpiredPackAuctionBids(): Promise<number> {
    const packs = await PackModel.query()
      .select('id')
      .where('expiresAt', '<=', new Date())
      .whereNull('ownerId')
      .whereNotNull('activeBidId')
      .withGraphFetched('activeBid.userAccount')
      .withGraphFetched('bids.userAccount')
      .limit(10)

    let count = 0

    for (const pack of packs) {
      if (await this.processExpiredPackAuction(pack)) {
        count++
      }
    }

    return count
  }
}
