import {
  AlgorandTransactionStatus,
  CollectibleActivity,
  CollectibleActivityType,
  CollectibleBase,
  CollectibleListingStatus,
  CollectibleListingType,
  CollectibleQuery,
  CollectibleShowcaseQuery,
  CollectibleSortField,
  CollectiblesQuery,
  CollectiblesResponse,
  CollectiblesShowcase,
  CollectibleTemplateIdQuery,
  CollectibleTemplateUniqueCodeQuery,
  CollectibleWithDetails,
  DEFAULT_LANG,
  DirectusCollectibleTemplate,
  DirectusCollection,
  DirectusSet,
  InitializeTransferCollectible,
  SortDirection,
  TransferCollectible,
  UserAccount,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import { decodeTransaction, WalletTransaction } from '@algomart/shared/algorand'
import {
  AlgorandTransactionGroupModel,
  AlgorandTransactionModel,
  CollectibleListingsModel,
  CollectibleModel,
  CollectibleShowcaseModel,
  UserAccountModel,
} from '@algomart/shared/models'
import {
  addDays,
  invariant,
  isBeforeNow,
  isDefinedArray,
  userInvariant,
} from '@algomart/shared/utils'
import { Model, QueryBuilder, raw } from 'objection'
import pino from 'pino'

import { AlgorandTransactionsService } from './algorand-transactions.service'
import {
  CMSCacheService,
  toCollectibleBase,
  toCollectionWithSets,
  toSetBase,
} from './cms-cache.service'

const MAX_SHOWCASES = 8

export interface CollectiblesServiceOptions {
  minimumDaysBetweenTransfers: number
}

export class CollectiblesService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly options: CollectiblesServiceOptions,
    private readonly cms: CMSCacheService,
    private readonly algorand: AlgorandAdapter,
    private readonly transactions: AlgorandTransactionsService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  getTransferrableAt(collectible: CollectibleModel): Date {
    // invariant(collectible.pack, 'must load collectible with its pack')
    invariant(
      collectible.latestTransferTransaction,
      'must load collectible with its latest transfer transaction'
    )

    return addDays(
      new Date(collectible.latestTransferTransaction.updatedAt),
      this.options.minimumDaysBetweenTransfers
    )
  }

  async getCollectible(
    query: CollectibleQuery
  ): Promise<CollectibleWithDetails> {
    const collectible = await CollectibleModel.query()
      .findOne({ address: query.assetId })
      .withGraphFetched(
        '[creationTransaction, latestTransferTransaction, pack, template.[collection, set], listings]'
      )
      .modifyGraph('listings', (builder) =>
        builder.where('status', CollectibleListingStatus.Active)
      )

    userInvariant(collectible, 'Collectible not found', 404)

    const transferrableAt = this.getTransferrableAt(collectible)

    const currentOwner = await this.algorand.getAssetOwner(collectible.address)
    const owner = await UserAccountModel.query()
      .alias('u')
      .join('AlgorandAccount as a', 'u.algorandAccountId', 'a.id')
      .where('a.address', '=', currentOwner?.address || '-')
      .first()

    const listingData =
      collectible.listings.length === 1
        ? {
            price: collectible.listings[0].price,
            listingType: collectible.listings[0].type,
            listingId: collectible.listings[0].id,
          }
        : undefined
    const template = toCollectibleBase(
      collectible.template.content as unknown as DirectusCollectibleTemplate,
      this.cms.options,
      query.language
    )
    const set = collectible.template.set
      ? toSetBase(
          collectible.template.set?.content as unknown as DirectusSet,
          query.language
        )
      : undefined
    const collection = collectible.template.collection
      ? toCollectionWithSets(
          collectible.template.collection
            ?.content as unknown as DirectusCollection,
          this.cms.options,
          query.language
        )
      : undefined

    const activeListing = collectible.listings?.find(
      (l) => l.status === CollectibleListingStatus.Active
    )

    return {
      ...template,
      ...listingData,
      activities: query.withActivities
        ? await this.getActivities(collectible.address)
        : undefined,
      set,
      collection,
      currentOwner: owner.username,
      currentOwnerAddress: currentOwner?.address,
      isFrozen: currentOwner?.assets.some(
        (asset) =>
          asset['asset-id'] === collectible.address && asset['is-frozen']
      ),
      transferrableAt: transferrableAt.toISOString(),
      listingStatus: activeListing?.status as CollectibleListingStatus,
      listingType: activeListing?.type as CollectibleListingType,
      price: activeListing?.price,
      id: collectible.id,
      edition: collectible.edition,
      address: collectible.address,
      mintedAt: collectible.creationTransaction?.createdAt,
      claimedAt:
        collectible.claimedAt instanceof Date
          ? collectible.claimedAt.toISOString()
          : collectible.claimedAt,
    }
  }

  async getActivities(assetId: number): Promise<CollectibleActivity[]> {
    // TODO: include transfers (as in: export/import)
    const collectible = await CollectibleModel.query()
      .findOne('address', assetId)
      .withGraphFetched('[creationTransaction, pack]')

    userInvariant(collectible, 'Collectible not found', 404)

    const activities: CollectibleActivity[] = []

    const initialRecipient = await UserAccountModel.query()
      .findById(collectible.pack.ownerId)
      .withGraphFetched('[algorandAccount]')

    if (initialRecipient) {
      activities.push({
        type: CollectibleActivityType.Mint,
        date: collectible.creationTransaction?.createdAt,
        recipient: initialRecipient
          ? {
              username: initialRecipient.username,
              address: initialRecipient.algorandAccount?.address,
            }
          : undefined,
      })
    }

    const listings = await CollectibleListingsModel.query()
      .where('collectibleId', collectible.id)
      .whereIn('status', [
        CollectibleListingStatus.Active,
        CollectibleListingStatus.Settled,
      ])
      .withGraphFetched('[seller.algorandAccount, buyer.algorandAccount]')

    activities.push(
      ...listings.flatMap((listing): CollectibleActivity[] => {
        const listingActivities: CollectibleActivity[] = [
          {
            type: CollectibleActivityType.List,
            date: listing.createdAt,
            amount: listing.price,
            sender: {
              username: listing.seller.username,
              address: listing.seller.algorandAccount.address,
            },
          },
        ]

        if (listing.status === CollectibleListingStatus.Settled) {
          listingActivities.push({
            type: CollectibleActivityType.Purchase,
            date: listing.purchasedAt,
            amount: listing.price,
            sender: {
              username: listing.seller.username,
              address: listing.seller.algorandAccount.address,
            },
            recipient: {
              username: listing.buyer.username,
              address: listing.buyer.algorandAccount.address,
            },
          })
        }

        return listingActivities
      })
    )

    // Newest activity first
    activities.sort((a, b) => {
      if (a.date < b.date) {
        return 1
      }
      if (a.date > b.date) {
        return -1
      }
      return 0
    })

    return activities
  }

  async getCollectibleTemplateById(
    query: CollectibleTemplateIdQuery
  ): Promise<CollectibleBase> {
    const template = await this.cms.findCollectibleByTemplateId(
      query.templateId,
      query.language
    )

    userInvariant(
      template,
      `NFT Template Id ${query.templateId} not found`,
      404
    )

    return template
  }

  async getCollectibleTemplateByUniqueCode(
    query: CollectibleTemplateUniqueCodeQuery
  ): Promise<CollectibleBase> {
    const template = await this.cms.findCollectibleByUniqueCode(
      query.uniqueCode,
      query.language
    )

    userInvariant(
      template,
      `NFT Template Unique Code ${query.uniqueCode} not found`,
      404
    )

    return template
  }

  async transferToCreatorFromUser(
    id: string,
    accountAddress?: string,
    userId?: string
  ) {
    userInvariant(userId || accountAddress, 'identifier not provided', 400)

    const collectible = await CollectibleModel.query().findById(id)
    userInvariant(collectible, 'collectible not found', 404)

    // Find the user to get the address IF the user ID was provided
    let userAddress: string = accountAddress
    if (userId) {
      const user = await UserAccountModel.query()
        .findById(userId)
        .withGraphFetched('algorandAccount')
      userInvariant(user, 'user account not found', 404)
      userAddress = user.algorandAccount.address
    }
    userInvariant(userAddress, 'address not found for user', 400)

    const assetIndex = collectible.address
    if (!assetIndex) {
      throw new Error('Collectible not yet minted')
    }

    const { creator } = await this.algorand.getAssetInfo(assetIndex)

    if (!creator) {
      throw new Error(
        `Collectible with asset index ${assetIndex} not found on blockchain`
      )
    }

    const { signedTransactions, transactionIds } =
      await this.algorand.generateClawbackTransactionsFromUser({
        assetIndex,
        fromAccountAddress: userAddress,
        toAccountAddress: creator,
      })

    const trx = await Model.startTransaction()

    try {
      const { transactions } = await this.transactions.saveSignedTransactions(
        signedTransactions,
        transactionIds,
        trx
      )

      // Remove ownership from collectible
      await CollectibleModel.query(trx).where('id', collectible.id).patch({
        ownerId: null,
        latestTransferTransactionId: transactions[0].id,
        claimedAt: new Date().toISOString(),
      })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Find a collectible by its listing ID and include any translations
   * @param listingId Which listing to use when looking up the collectible
   * @param overrideLanguage Optionally override the language, use the associated seller's language if not provided
   * @returns The collectible associated with the listing
   */
  async getTemplateByListingId(
    listingId: string,
    transferLanguage: 'buyer' | 'seller' = 'seller',
    overrideLanguage?: string
  ) {
    const listingWithParty = await CollectibleListingsModel.query()
      .findById(listingId)
      .withGraphFetched('[seller, buyer]')
    invariant(listingWithParty, `listing ${listingId} not found`)

    const collectible = await CollectibleModel.query().findById(
      listingWithParty.collectibleId
    )
    invariant(
      collectible,
      `collectible ${listingWithParty.collectibleId} not found`
    )

    const template = await this.cms.findCollectibleByTemplateId(
      collectible.templateId,
      overrideLanguage ??
        (transferLanguage === 'seller'
          ? listingWithParty.seller.language
          : listingWithParty.buyer.language)
    )
    invariant(`template ${collectible.templateId} not found`)

    return template
  }

  async searchCollectibles({
    algoAddress,
    collectionIds,
    joinTemplates = true,
    joinListings = false,
    joinCurrentOwner = false,
    language = DEFAULT_LANG,
    listingType = [
      CollectibleListingType.Auction,
      CollectibleListingType.FixedPrice,
    ],
    listingStatus,
    userExternalId,
    username,
    page = 1,
    pageSize = 10,
    priceHigh,
    priceLow,
    setIds,
    sortBy = CollectibleSortField.ClaimedAt,
    sortDirection = SortDirection.Ascending,
    templateIds,
  }: CollectiblesQuery): Promise<CollectiblesResponse | null> {
    const queryBuild: QueryBuilder<CollectibleModel> = CollectibleModel.query()

    const ownerIdentifier = userExternalId || username

    if (ownerIdentifier) {
      const field = username ? 'username' : 'externalId'
      const account = await UserAccountModel.query()
        .findOne({ [field]: ownerIdentifier })
        .select('id')

      userInvariant(account, 'no user found', 404)

      queryBuild.where('ownerId', account.id)
    }

    if (algoAddress) {
      // Get assets on the requested address
      const { assets } = await this.algorand.getAccountInfo(algoAddress)

      // Find corresponding assets in DB
      queryBuild.whereIn(
        'address',
        assets.map((a) => a['asset-id'])
      )
    }

    if (templateIds) queryBuild.whereIn('templateId', templateIds)

    if (joinTemplates) {
      queryBuild.withGraphFetched('template')
      queryBuild.joinRelated('template')

      if (setIds) queryBuild.whereIn('template.setId', setIds)
      if (collectionIds)
        queryBuild.whereIn('template.collectionId', collectionIds)
    }

    queryBuild.withGraphFetched('listings')

    if (joinListings) {
      const listingsQuery = CollectibleModel.relatedQuery('listings').where(
        'status',
        CollectibleListingStatus.Active
      )

      if (listingType) listingsQuery.whereIn('type', listingType)

      if (listingStatus) listingsQuery.whereIn('status', listingType)
      if (priceHigh) listingsQuery.where('price', '<=', Math.round(priceHigh))

      if (priceLow) listingsQuery.where('price', '>=', Math.round(priceLow))

      queryBuild.whereExists(listingsQuery)
    }

    const sortByRarity = sortBy === CollectibleSortField.Rarity

    if (sortByRarity) {
      queryBuild.joinRelated('template')
      queryBuild.orderBy(
        raw("COALESCE(template.content->'rarity'->'code', null)"),
        sortDirection
      )
    } else {
      queryBuild.orderBy(sortBy, sortDirection)
    }

    const { total, results } = await queryBuild.page(
      page - 1,
      pageSize != -1 ? pageSize : Number.MAX_SAFE_INTEGER
    )

    const mappedCollectibles = await Promise.all(
      results.map(async (c: CollectibleModel) => {
        // For each mapped collectible, we need to ask algorand indexer for the given owner
        // There may be a better way to do this
        const assetOwner = joinCurrentOwner
          ? await this.algorand.getAssetOwner(c.address)
          : undefined
        const userAccountOwner = joinCurrentOwner
          ? await UserAccountModel.query()
              .alias('u')
              .join('AlgorandAccount as a', 'u.algorandAccountId', 'a.id')
              .where('a.address', '=', assetOwner?.address || '-')
              .first()
          : undefined

        const currentOwner = assetOwner
          ? {
              currentOwner: userAccountOwner?.username,
              currentOwnerAddress: assetOwner?.address,
            }
          : undefined

        const template = c.template
          ? toCollectibleBase(
              c.template.content as unknown as DirectusCollectibleTemplate,
              this.cms.options,
              language
            )
          : undefined

        const activeListing = c.listings?.find(
          (l) => l.status === CollectibleListingStatus.Active
        )

        return {
          ...template,
          ...currentOwner,
          ...c,
          listingId: activeListing?.id,
          listingStatus: activeListing?.status as CollectibleListingStatus,
          listingType: activeListing?.type as CollectibleListingType,
          price: activeListing?.price,
          claimedAt:
            c.claimedAt instanceof Date
              ? c.claimedAt.toISOString()
              : c.claimedAt,
        } as CollectibleWithDetails
      })
    )

    return {
      total,
      collectibles: mappedCollectibles,
    }
  }

  async getShowcaseCollectibles({
    language = DEFAULT_LANG,
    ownerUsername,
  }: CollectibleShowcaseQuery) {
    const user = await UserAccountModel.query()
      .findOne({ username: ownerUsername })
      .select('id', 'showProfile')
    userInvariant(user, 'user not found', 404)

    const showcase = await CollectibleShowcaseModel.query()
      .where('ownerId', user.id)
      .orderBy('order', 'asc')
      .withGraphFetched('collectible')

    const collectibles = showcase.map(({ collectible }) => collectible)
    userInvariant(
      isDefinedArray<CollectibleModel>(collectibles),
      'showcase collectibles not found',
      404
    )

    if (collectibles.length === 0) {
      return {
        collectibles: [],
        showProfile: user.showProfile,
      }
    }

    const templateIds = [...new Set(collectibles.map((c) => c.templateId))]

    const { collectibles: templates } = await this.cms.findAllCollectibles(
      language,
      {
        id: {
          _in: templateIds,
        },
      },
      templateIds.length
    )

    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))

    const mappedCollectibles = collectibles.map((c): CollectibleWithDetails => {
      const template = templateLookup.get(c.templateId)
      invariant(template !== undefined, `template ${c.templateId} not found`)

      return {
        ...template,
        claimedAt:
          c.claimedAt instanceof Date
            ? c.claimedAt.toISOString()
            : c.claimedAt ?? undefined,
        id: c.id,
        address: c.address ?? undefined,
        edition: c.edition,
      }
    })

    return {
      collectibles: mappedCollectibles,
      showProfile: user.showProfile,
    } as CollectiblesShowcase
  }

  async addShowcaseCollectible(
    user: UserAccount,
    {
      collectibleId,
    }: {
      collectibleId: string
    }
  ) {
    const collectible = await CollectibleModel.query().findOne({
      ownerId: user.id,
      id: collectibleId,
    })

    userInvariant(collectible, 'collectible not found', 404)

    const showcases = await CollectibleShowcaseModel.query()
      .where('ownerId', user.id)
      .orderBy('order', 'desc')

    const latestShowcase = showcases[0]

    userInvariant(showcases.length <= MAX_SHOWCASES, 'too many showcases')
    userInvariant(
      !showcases.some((s) => s.collectibleId === collectibleId),
      'collectible already in the showcase'
    )

    const trx = await Model.startTransaction()

    try {
      await CollectibleShowcaseModel.query(trx).insert({
        collectibleId: collectible.id,
        ownerId: user.id,
        order: latestShowcase ? latestShowcase.order + 1 : 1,
      })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async removeShowcaseCollectible(
    user: UserAccount,
    {
      collectibleId,
    }: {
      collectibleId: string
    }
  ) {
    const showcaseToBeRemoved = await CollectibleShowcaseModel.query().findOne({
      ownerId: user.id,
      collectibleId: collectibleId,
    })

    userInvariant(showcaseToBeRemoved, 'collectible not found', 404)

    const trx = await Model.startTransaction()

    try {
      await CollectibleShowcaseModel.query(trx).deleteById(
        showcaseToBeRemoved.id
      )

      // normalize the order of the remaining showcases, this way order will
      // always stay in the range of 1..MAX_SHOWCASES (inclusive)
      const showcases = await CollectibleShowcaseModel.query(trx)
        .where('ownerId', user.id)
        .orderBy('order', 'asc')

      await Promise.all(
        showcases.map(async (showcase, index) => {
          await CollectibleShowcaseModel.query(trx)
            .where('id', showcase.id)
            .patch({
              order: index + 1,
            })
        })
      )

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async initializeExportCollectible(
    request: InitializeTransferCollectible
  ): Promise<WalletTransaction[]> {
    const user = await UserAccountModel.query()
      .findOne({
        externalId: request.userExternalId,
      })
      .withGraphFetched('algorandAccount')

    userInvariant(user, 'user not found', 404)
    invariant(user.algorandAccount, 'algorand account not loaded')

    const collectible = await CollectibleModel.query()
      .findOne({
        address: request.assetIndex,
      })
      .withGraphFetched(
        '[creationTransaction, latestTransferTransaction, pack]'
      )

    userInvariant(collectible, 'collectible not found', 404)
    userInvariant(
      collectible.ownerId == user.id,
      'not the owner of this collectible',
      400
    )
    userInvariant(
      collectible.creationTransaction?.createdAt,
      'collectible not minted',
      400
    )

    const transferrableAt = this.getTransferrableAt(collectible)

    userInvariant(
      isBeforeNow(transferrableAt),
      'collectible cannot yet be transferred',
      400
    )

    const transactions = await this.algorand.generateExportTransactions({
      assetIndex: request.assetIndex,
      fromAccountAddress: user.algorandAccount.address,
      toAccountAddress: request.address,
    })

    await AlgorandTransactionGroupModel.query().insertGraph({
      transactions: await Promise.all(
        transactions.map(async (walletTxn) => {
          const txn = await decodeTransaction(walletTxn.txn)
          return {
            address: txn.txID(),
            // Note the Unsigned status
            status: AlgorandTransactionStatus.Unsigned,
            encodedTransaction: walletTxn.txn,
            signer: walletTxn.signers?.[0],
          }
        })
      ),
    })

    return transactions
  }

  async exportCollectible(request: TransferCollectible): Promise<string> {
    const user = await UserAccountModel.query()
      .findOne({
        externalId: request.userExternalId,
      })
      .withGraphFetched('algorandAccount')

    userInvariant(user, 'user not found', 404)
    invariant(user.algorandAccount, 'algorand account not loaded')

    const collectible = await CollectibleModel.query()
      .findOne({
        address: request.assetIndex,
      })
      .withGraphFetched(
        '[creationTransaction, latestTransferTransaction, pack]'
      )

    userInvariant(collectible, 'collectible not found', 404)
    userInvariant(
      collectible.ownerId == user.id,
      'not the owner of this collectible',
      400
    )
    userInvariant(
      collectible.creationTransaction?.createdAt,
      'collectible not minted',
      400
    )

    const transferrableAt = this.getTransferrableAt(collectible)

    userInvariant(
      isBeforeNow(transferrableAt),
      'collectible cannot yet be transferred',
      400
    )

    // Load transaction, the group, and related transactions
    const transaction = await AlgorandTransactionModel.query()
      .findOne({
        address: request.transactionId,
        status: AlgorandTransactionStatus.Unsigned,
      })
      .withGraphFetched('group.transactions')
    invariant(
      transaction.group?.transactions?.length >= 1,
      'failed to load transaction group'
    )

    const { group } = transaction

    const result = await this.algorand.signTransferTransactions({
      encryptedMnemonic: user.algorandAccount.encryptedKey,
      transactions: group.transactions.map(
        ({ signer, encodedTransaction, address }): WalletTransaction => {
          const signedTxn =
            address === transaction.address ? request.signedTransaction : null
          return {
            signers: request.transactionId === address ? [] : [signer],
            txn: encodedTransaction,
            txID: address,
            stxn: signedTxn,
          }
        }
      ),
    })

    const trx = await Model.startTransaction()

    try {
      await Promise.all(
        result.transactionIds.map((txID, index) => {
          return AlgorandTransactionModel.query(trx)
            .where('address', txID)
            .patch({
              status: AlgorandTransactionStatus.Signed,
              encodedSignedTransaction: result.signedTransactions[index],
            })
        })
      )

      await CollectibleModel.query(trx)
        .findOne({ id: collectible.id })
        .patch({ ownerId: null })

      await trx.commit()
      return result.transactionIds[0]
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async initializeImportCollectible(
    request: InitializeTransferCollectible
  ): Promise<WalletTransaction[]> {
    // Find the user's custodial wallet
    const user = await UserAccountModel.query()
      .findOne({
        externalId: request.userExternalId,
      })
      .withGraphFetched('algorandAccount')
    userInvariant(user, 'user not found', 404)
    invariant(user.algorandAccount, 'algorand account not loaded')

    // Find the collectible, it must be owned by the non-custodial wallet
    const collectible = await CollectibleModel.query().findOne({
      address: request.assetIndex,
      ownerId: null,
    })
    userInvariant(collectible, 'collectible not found', 404)

    // Ensure the sender currently owns the asset
    const accountInfo = await this.algorand.getAccountInfo(request.address)
    userInvariant(
      accountInfo.assets.some(
        (asset) => asset.assetIndex === request.assetIndex && asset.amount === 1
      ),
      'must own the asset to import',
      400
    )

    // Generate the transactions that will need to be signed, but do not yet
    // submit them to Algorand! That will be done in a separate step.
    const transactions = await this.algorand.generateImportTransactions({
      assetIndex: request.assetIndex,
      fromAccountAddress: request.address,
      toAccountAddress: user.algorandAccount.address,
    })

    // Store all of the unsigned transactions for later reference

    await AlgorandTransactionGroupModel.query().insertGraph({
      transactions: await Promise.all(
        transactions.map(async (walletTxn) => {
          const txn = await decodeTransaction(walletTxn.txn)
          return {
            address: txn.txID(),
            // Note the Unsigned status
            status: AlgorandTransactionStatus.Unsigned,
            encodedTransaction: walletTxn.txn,
            signer: walletTxn.signers?.[0],
          }
        })
      ),
    })

    return transactions
  }

  async importCollectible(request: TransferCollectible): Promise<string> {
    // Find the user's custodial wallet
    const user = await UserAccountModel.query()
      .findOne({
        externalId: request.userExternalId,
      })
      .withGraphFetched('algorandAccount')
    userInvariant(user, 'user not found', 404)
    invariant(user.algorandAccount, 'algorand account not loaded')

    // Find the collectible, it must be owned by the non-custodial wallet
    const collectible = await CollectibleModel.query().findOne({
      address: request.assetIndex,
      ownerId: null,
    })
    userInvariant(collectible, 'collectible not found', 404)

    // Ensure the sender still owns the asset
    const accountInfo = await this.algorand.getAccountInfo(request.address)
    userInvariant(
      accountInfo.assets.some(
        (asset) => asset.assetIndex === request.assetIndex && asset.amount === 1
      ),
      'must own the asset to import',
      400
    )

    // Load transaction, the group, and related transactions
    const transaction = await AlgorandTransactionModel.query()
      .findOne({
        address: request.transactionId,
        status: AlgorandTransactionStatus.Unsigned,
      })
      .withGraphFetched('group.transactions')
    invariant(
      transaction.group?.transactions?.length >= 1,
      'failed to load transaction group'
    )

    const { group } = transaction

    const result = await this.algorand.signTransferTransactions({
      encryptedMnemonic: user.algorandAccount.encryptedKey,
      transactions: group.transactions.map(
        ({ signer, encodedTransaction, address }): WalletTransaction => {
          const signedTxn =
            address === transaction.address ? request.signedTransaction : null
          return {
            signers: request.transactionId === address ? [] : [signer],
            txn: encodedTransaction,
            txID: address,
            stxn: signedTxn,
          }
        }
      ),
    })

    const trx = await Model.startTransaction()

    try {
      await Promise.all(
        result.transactionIds.map((txID, index) => {
          return AlgorandTransactionModel.query(trx)
            .where('address', txID)
            .patch({
              status: AlgorandTransactionStatus.Signed,
              encodedSignedTransaction: result.signedTransactions[index],
            })
        })
      )

      await CollectibleModel.query(trx)
        .findOne({ id: collectible.id })
        .patch({ ownerId: user.id })

      await trx.commit()
      return result.transactionIds[0]
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }
}
