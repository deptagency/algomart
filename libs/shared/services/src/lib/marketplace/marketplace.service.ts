import {
  AlgorandTransactionStatus,
  CircleTransferStatus,
  CollectibleListingsQuery,
  CollectibleListingsResponse,
  CollectibleListingsSortField,
  CollectibleListingStatus,
  CollectibleListingType,
  DEFAULT_LANG,
  DelistCollectible,
  DirectusCollectibleTemplate,
  ListCollectibleForSale,
  SortDirection,
  UserAccount,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import { decodeRawSignedTransaction } from '@algomart/shared/algorand'
import {
  CollectibleListingsModel,
  CollectibleModel,
  CollectibleOwnershipModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import { addDays, invariant, userInvariant } from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import {
  Expression,
  Model,
  PrimitiveValue,
  raw,
  ref,
  Transaction,
} from 'objection'

import {
  AccountsService,
  AlgorandTransactionsService,
  PaymentsService,
  toCollectibleBase,
  UserAccountTransfersService,
} from '..'

export interface MarketplaceServiceOptions {
  royaltyBasisPoints: number
  minimumDaysBetweenTransfers: number
  cmsUrl: string
  gcpCdnUrl: string
}

export class MarketplaceService {
  constructor(
    private readonly options: MarketplaceServiceOptions,
    private readonly algorand: AlgorandAdapter,
    private readonly transfers: UserAccountTransfersService,
    private readonly transactions: AlgorandTransactionsService,
    private readonly accounts: AccountsService,
    private readonly payments: PaymentsService
  ) {}

  async createListing(
    seller: UserAccount,
    { price, collectibleId }: ListCollectibleForSale
  ) {
    // Fetch and assert valid collectible
    const collectible = await CollectibleModel.query()
      .findById(collectibleId)
      .where('ownerId', seller.id)
    userInvariant(collectible, 'Collectible not found')

    // Assert that the user is currently holding the ASA.
    // Mostly as a sanity check since we require custodial accounts for this feature.
    const accountInfo = await this.algorand.getAccountInfo(
      seller.algorandAccount.address
    )
    userInvariant(
      accountInfo?.assets?.some(
        (asset) => asset.assetIndex === collectible.address && asset.amount > 0
      ),
      'User is not holding the ASA'
    )

    const trx = await Model.startTransaction()
    try {
      const collectible = await CollectibleModel.query(trx)
        .select('id')
        .where('id', collectibleId)
        // Ensure user is the current owner (still)
        .where('ownerId', seller.id)
        // Ensure no other active listings / in progress sales exist for this collectible
        .whereNotExists(
          CollectibleListingsModel.query(trx)
            .where('collectibleId', collectibleId)
            .whereNotIn('status', [
              CollectibleListingStatus.Settled,
              CollectibleListingStatus.Canceled,
            ])
        )
        // Ensure collectible is tradeable
        .whereExists(this.getCollectibleTradeableQuery(collectibleId, trx))
        .first()

      userInvariant(collectible, 'Collectible not available to list for sale')

      const listing = await CollectibleListingsModel.query(trx).insert({
        price,
        sellerId: seller.id,
        type: CollectibleListingType.FixedPrice,
        status: CollectibleListingStatus.Active,
        collectibleId: collectible.id,
      })

      await trx.commit()

      return listing
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Search function for filtering through collectible listings
   *
   * Note: This will only return 1 collectible listing per template Id
   * It is designed to grab cheapest listing per unique template
   */
  async searchListings({
    language = DEFAULT_LANG,
    listingStatus = [CollectibleListingStatus.Active],
    listingType = [CollectibleListingType.FixedPrice],
    page = 1,
    pageSize = 10,
    priceHigh = 50_000,
    priceLow = 0,
    sortBy = CollectibleListingsSortField.CreatedAt,
    sortDirection = SortDirection.Ascending,
    tags = [],
  }: CollectibleListingsQuery): Promise<CollectibleListingsResponse | null> {
    userInvariant(page > 0, 'page must be >= 1', 400)
    userInvariant(priceHigh >= priceLow, 'priceHigh must be >= priceLow', 400)

    let queryBuilder = CollectibleListingsModel.query()
      .select(
        // Need collectible template for toCollectibleBase
        'CmsCacheCollectibleTemplates.content as template',
        // Get lowest price
        raw('min("CollectibleListings"."price") as "price"'),
        // Get oldest listing
        raw('min("CollectibleListings"."createdAt") as "createdAt"'),
        // Lowest edition number
        raw('min("Collectible"."edition") as "edition"')
      )
      // Use inner join, if collectible is missing something's wrong and listing should be ignored
      .join(
        'Collectible',
        'Collectible.id',
        'CollectibleListings.collectibleId'
      )
      .whereBetween('price', [priceLow, priceHigh])
      .whereIn('status', listingStatus)
      .whereIn('type', listingType)
      .orderBy(sortBy, sortDirection)
      .groupBy('CmsCacheCollectibleTemplates.content')
      .page(page - 1, pageSize != -1 ? pageSize : Number.MAX_SAFE_INTEGER)
      // Cast type for TypeScript
      .castTo<{
        total: number
        results: Array<{
          templateId: string
          template: DirectusCollectibleTemplate
          price: number
          createdAt: string
          edition: number
        }>
      }>()

    queryBuilder =
      tags.length > 0
        ? queryBuilder.joinRaw(
            'INNER JOIN search_collectible_templates(?) AS "CmsCacheCollectibleTemplates" ON "CmsCacheCollectibleTemplates".id = "Collectible"."templateId"',
            [tags]
          )
        : queryBuilder.join(
            'CmsCacheCollectibleTemplates',
            'CmsCacheCollectibleTemplates.id',
            'Collectible.templateId'
          )

    const { total, results } = await queryBuilder

    const mappedCollectibleListings = results.map((c) => ({
      ...toCollectibleBase(c.template, this.options, language),
      price: c.price,
      edition: c.edition,
      // Using dummy values here as these are not needed/used on `/marketplace`
      listingStatus: CollectibleListingStatus.Active,
      listingType: CollectibleListingType.FixedPrice,
    }))

    return {
      total,
      collectibleListings: mappedCollectibleListings,
    }
  }

  async delistCollectible(sellerId: string, { listingId }: DelistCollectible) {
    const listing = await CollectibleListingsModel.query()
      .where('id', listingId)
      .where('status', CollectibleListingStatus.Active)
      .where('sellerId', sellerId)
      .patch({
        status: CollectibleListingStatus.Canceled,
      })
      .returning('*')
      .first()
    userInvariant(listing, 'Unable to delist collectible')
  }

  async purchaseListingWithCredits(
    buyerId: string,
    listingId: string
  ): Promise<UserAccountTransferModel> {
    const buyerTransfer = await this.payments.purchaseListingWithCredits(
      buyerId,
      listingId
    )

    return buyerTransfer
  }

  async submitTransferToSellerForSuccessfulMarketplacePurchase(
    listingId: string
  ) {
    const pendingSellerTransfer = await UserAccountTransferModel.query()
      .alias('uat')
      .innerJoin('CollectibleListings as cl', 'cl.id', 'uat.entityId')
      .where('uat.userAccountId', ref('cl.sellerId'))
      .where('uat.entityId', listingId)
      .where('uat.status', CircleTransferStatus.Pending)
      .first()

    invariant(
      pendingSellerTransfer,
      'No pending seller transfer found',
      UnrecoverableError
    )

    await this.transfers.startSubmitCreditsTransfer(pendingSellerTransfer.id)
  }

  async revertListingAndMarkCreditsTransferJobComplete(
    transferId: string,
    listingId: string
  ) {
    const trx = await Model.startTransaction()
    try {
      // Revert the listing
      const listing = await CollectibleListingsModel.query(trx)
        .patch({
          status: CollectibleListingStatus.Active,
          claimedAt: null,
          buyerId: null,
          purchasedAt: null,
        })
        .where('id', listingId)
        .returning('*')
        .first()

      // Mark buyer job complete
      await UserAccountTransferModel.query(trx)
        .where({ id: transferId })
        .patch({ creditsTransferJobCompletedAt: new Date().toISOString() })

      // Mark the pending seller transfer as failed
      // due to buyer's failure to complete the transfer
      await UserAccountTransferModel.query(trx)
        .where('entityId', listingId)
        .where('userAccountId', listing.sellerId)
        .where('status', CircleTransferStatus.Pending)
        .patch({
          status: CircleTransferStatus.Failed,
          errorDetails: 'Buyer failed to complete credits transfer',
        })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async isCollectibleTradeable(collectibleId: string) {
    const { count } = await this.getCollectibleTradeableQuery(collectibleId)
      .count({ count: '*' })
      .castTo<{ count?: number | string | undefined }>()
    // Objection/Knex may return `number`, `string`, or `undefined`
    const countNumber =
      typeof count === 'number'
        ? count
        : typeof count === 'string'
        ? Number.parseInt(count, 10)
        : 0
    return countNumber > 0
  }

  /**
   * Use this to ensure the collectible is available for trading. Essentially
   * this means the collectible's last transfer transaction has been confirmed
   * and was last done at least `minimumDaysBetweenTransfers` days ago.
   * @param collectibleIdOrExpression The ID of the collectible to check or a SQL expression
   * @param trx Optional DB transaction
   * @returns A sub-query for whereExists / whereNotExists
   */
  private getCollectibleTradeableQuery(
    collectibleIdOrExpression: Expression<PrimitiveValue>,
    trx?: Transaction
  ) {
    // Check when the previous transfer transaction was completed
    return (
      CollectibleModel.query(trx)
        .alias('c')
        .join(
          'AlgorandTransaction as t',
          'c.latestTransferTransactionId',
          't.id'
        )
        // Grab the same collectible that we're about to update
        .where('c.id', collectibleIdOrExpression)
        // Must have been confirmed
        .where('t.status', AlgorandTransactionStatus.Confirmed)
        // Must be from X days ago
        .where(
          't.updatedAt',
          '<',
          addDays(
            new Date(),
            -this.options.minimumDaysBetweenTransfers
          ).toISOString()
        )
    )
  }

  private async createTradeTransactionsForListing(listingId: string) {
    const listing = await CollectibleListingsModel.query()
      .findById(listingId)
      .withGraphFetched(
        '[collectible, buyer.algorandAccount, seller.algorandAccount]'
      )

    const { collectible: collectibleBeforeUpdate, buyer, seller } = listing

    const currentOwner = await this.algorand.getAssetOwner(
      collectibleBeforeUpdate.address
    )
    if (currentOwner.address === buyer.algorandAccount.address) {
      // No-op, the buyer is already the owner
      return
    }

    invariant(
      seller.algorandAccount.address === currentOwner.address,
      'Seller is no longer the owner of the NFT',
      UnrecoverableError
    )

    const { signedTransactions, transactionIds } =
      await this.algorand.generateTradeTransactions({
        assetIndex: collectibleBeforeUpdate.address,
        buyerEncryptedMnemonic: buyer.algorandAccount.encryptedKey,
        sellerEncryptedMnemonic: seller.algorandAccount.encryptedKey,
      })

    const trx = await Model.startTransaction()

    try {
      const { transactions } = await this.transactions.saveSignedTransactions(
        signedTransactions,
        transactionIds,
        trx
      )

      const affectedRows = await CollectibleModel.query(trx)
        .where('id', collectibleBeforeUpdate.id)
        // Mostly a sanity check since this collectible should not have been
        // listed for sale if it's not yet tradeable
        .whereExists(
          this.getCollectibleTradeableQuery(collectibleBeforeUpdate.id, trx)
        )
        .patch({
          // Only patch the transfer for now, we'll update the ownerId later
          // when the transfer transaction is confirmed
          latestTransferTransactionId: transactions[0].id,
        })

      invariant(
        affectedRows > 0,
        'No rows affected, collectible is not yet tradeable',
        UnrecoverableError
      )

      await trx.commit()
    } catch (error) {
      await trx.rollback()

      // Attempt to reset the collectible's latest transfer transaction
      await CollectibleModel.query()
        .findById(collectibleBeforeUpdate.id)
        .patch({
          latestTransferTransactionId:
            collectibleBeforeUpdate.latestTransferTransactionId,
        })

      throw error
    }
  }

  private async settleListing(listingId: string) {
    const trx = await Model.startTransaction()
    try {
      const listing = await CollectibleListingsModel.query(trx)
        .where('id', listingId)
        .where('status', CollectibleListingStatus.TransferringNFT)
        .patch({
          status: CollectibleListingStatus.Settled,
        })
        .returning('*')
        .first()
      invariant(listing, 'Listing was in a bad status', UnrecoverableError)

      await CollectibleModel.query(trx)
        .where('id', listing.collectibleId)
        .where('ownerId', listing.sellerId)
        .patch({
          ownerId: listing.buyerId,
          claimedAt: new Date().toISOString(),
        })

      await CollectibleOwnershipModel.query(trx).insert({
        collectibleId: listing.collectibleId,
        ownerId: listing.buyerId,
      })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async tradeListing(listingId: string) {
    const listing = await CollectibleListingsModel.query()
      .alias('l')
      .where('id', listingId)
      .where('status', CollectibleListingStatus.TransferringCredits)
      .whereExists(
        this.getCollectibleTradeableQuery(raw('"l"."collectibleId"'))
      )
      .patch({
        status: CollectibleListingStatus.TransferringNFT,
      })
      .returning('*')
      .first()

    if (!listing) {
      const _listing = await CollectibleListingsModel.query()
        .where('id', listingId)
        .where('status', CollectibleListingStatus.Settled)
        .first()

      if (_listing) {
        // No-op, the listing has already been settled
        // Allows retry in case retrying because seller transer
        // could not be queued
        return null
      }

      throw new UnrecoverableError('Listing is in an unexpected status')
    }

    try {
      await this.accounts.ensureAccountMinBalance(listing.buyerId)

      await this.createTradeTransactionsForListing(listingId)

      // We may or may not have created new transactions
      const collectible = await CollectibleModel.query()
        .findOne('id', listing.collectibleId)
        .withGraphFetched(
          'latestTransferTransaction.group.transactions(orderAscByOrderField)'
        )

      const { transactions } = collectible.latestTransferTransaction.group

      const transactionIds = []
      const signedTransactions = []

      for (const transaction of transactions) {
        transactionIds.push(transaction.address)
        signedTransactions.push(
          decodeRawSignedTransaction(transaction.encodedSignedTransaction)
        )
      }

      await this.transactions.submitAndWaitForTransactionsIfNecessary(
        signedTransactions,
        transactionIds
      )

      await this.settleListing(listingId)

      // Fetch the latest version of the listing
      return await CollectibleListingsModel.query().findById(listingId)
    } catch (error) {
      await CollectibleListingsModel.query().where('id', listingId).patch({
        status: CollectibleListingStatus.TransferringCredits,
      })

      throw error
    }
  }

  async getListingById(listingId: string) {
    const listing = await CollectibleListingsModel.query().findById(listingId)
    userInvariant(listing, 'Listing not found', 404)
    return listing
  }
}
