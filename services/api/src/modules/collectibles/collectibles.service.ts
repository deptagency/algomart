import {
  AlgorandTransactionStatus,
  CollectibleBase,
  CollectibleListQuerystring,
  CollectibleListWithTotal,
  CollectibleSortField,
  CollectibleWithDetails,
  DEFAULT_LOCALE,
  EventAction,
  EventEntityType,
  SortDirection,
} from '@algomart/schemas'
import { CollectibleListShowcase } from '@algomart/schemas'
import { CollectibleShowcaseQuerystring } from '@algomart/schemas'
import { Transaction } from 'objection'

import AlgorandAdapter from '@/lib/algorand-adapter'
import DirectusAdapter, { ItemFilter } from '@/lib/directus-adapter'
import { AlgorandAccountModel } from '@/models/algorand-account.model'
import { AlgorandTransactionModel } from '@/models/algorand-transaction.model'
import { CollectibleModel } from '@/models/collectible.model'
import { CollectibleOwnershipModel } from '@/models/collectible-ownership.model'
import { CollectibleShowcaseModel } from '@/models/collectible-showcase.model'
import { EventModel } from '@/models/event.model'
import { UserAccountModel } from '@/models/user-account.model'
import { isDefinedArray } from '@/utils/arrays'
import { invariant, userInvariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

const MAX_SHOWCASES = 8

export default class CollectiblesService {
  logger = logger.child({ context: this.constructor.name })

  constructor(
    private readonly cms: DirectusAdapter,
    private readonly algorand: AlgorandAdapter
  ) {}

  async generateCollectibles(limit = 5, trx?: Transaction) {
    const existingTemplates = await CollectibleModel.query(trx)
      .groupBy('templateId')
      .select('templateId')

    const filter: ItemFilter = {}

    if (existingTemplates.length > 0) {
      filter.id = {
        _nin: existingTemplates.map((c) => c.templateId),
      }
    }

    const { collectibles: templates } = await this.cms.findAllCollectibles(
      undefined,
      filter,
      limit
    )

    if (templates.length === 0) {
      return 0
    }

    const collectibles = await CollectibleModel.query(trx).insert(
      templates.flatMap((t) =>
        Array.from({ length: t.totalEditions }, (_, index) => ({
          edition: index + 1,
          templateId: t.templateId,
        }))
      )
    )

    await EventModel.query(trx).insert(
      collectibles.flatMap((c) => ({
        action: EventAction.Create,
        entityType: EventEntityType.Collectible,
        entityId: c.id,
      }))
    )

    return collectibles.length
  }

  async getCollectiblesByPackId(packId: string, trx?: Transaction) {
    return await CollectibleModel.query(trx).where('packId', packId)
  }

  async mintCollectibles(limit = 16, trx?: Transaction) {
    const collectibles = await CollectibleModel.query(trx)
      .whereNull('creationTransactionId')
      .limit(limit)

    if (collectibles.length === 0) {
      this.logger.info('no collectibles to mint')
      return 0
    }

    // Get distinct template ids
    const templateIds = [...new Set(collectibles.map((c) => c.templateId))]

    const { collectibles: templates } = await this.cms.findAllCollectibles(
      undefined,
      {
        id: {
          _in: templateIds,
        },
      }
    )

    // Hard-coded to be true until 1000 asset limit is removed
    const useCreatorAccount = true

    const { signedTransactions, transactionIds, creator } =
      await this.algorand.generateCreateAssetTransactions(
        collectibles,
        templates,
        useCreatorAccount
      )

    this.logger.info('Using creator account %s', creator?.address || '-')

    try {
      await this.algorand.submitTransaction(signedTransactions)
    } catch (error) {
      if (creator) {
        this.logger.info('Closing creator account %s', creator.address)
        await this.algorand.closeCreatorAccount(creator)
      }
      throw error
    }

    if (creator) {
      const transactions = await AlgorandTransactionModel.query(trx).insert([
        {
          // funding transaction
          address: creator.transactionIds[0],
          // Creator must already be confirmed for us to get here
          status: AlgorandTransactionStatus.Confirmed,
        },
        {
          // non-participation transaction
          address: creator.transactionIds[1],
          status: AlgorandTransactionStatus.Pending,
        },
      ])

      const creatorAccount = await AlgorandAccountModel.query(trx).insertGraph(
        {
          address: creator.address,
          encryptedKey: creator.encryptedMnemonic,
          creationTransactionId: transactions[0].id,
        },
        { relate: true }
      )

      await EventModel.query(trx).insert({
        action: EventAction.Create,
        entityType: EventEntityType.AlgorandAccount,
        entityId: creatorAccount.id,
      })
    }

    await CollectibleModel.query(trx).upsertGraph(
      collectibles.map((c, index) => ({
        id: c.id,
        creationTransaction: {
          address: transactionIds[index],
          status: AlgorandTransactionStatus.Pending,
        },
      })),
      { relate: true }
    )

    const createdTransactions = await AlgorandTransactionModel.query(trx)
      .whereIn('address', transactionIds)
      .select('id')

    await EventModel.query(trx).insert([
      ...collectibles.map((c) => ({
        action: EventAction.Update,
        entityType: EventEntityType.Collectible,
        entityId: c.id,
      })),
      ...createdTransactions.map((t) => ({
        action: EventAction.Create,
        entityType: EventEntityType.AlgorandTransaction,
        entityId: t.id,
      })),
    ])

    return collectibles.length
  }

  async transferToUserFromCreator(
    id: string,
    userId: string,
    passphrase: string,
    trx?: Transaction
  ) {
    const collectible = await CollectibleModel.query(trx).findById(id)
    const user = await UserAccountModel.query(trx)
      .findById(userId)
      .withGraphFetched('algorandAccount')

    userInvariant(user, 'user account not found', 404)
    userInvariant(collectible, 'collectible not found', 404)

    const encryptedMnemonic = user.algorandAccount?.encryptedKey
    const assetIndex = collectible.address

    if (!encryptedMnemonic) {
      throw new Error('User missing algorand account')
    }

    if (!assetIndex) {
      throw new Error('Collectible not yet minted')
    }

    const info = await this.algorand.getAssetInfo(assetIndex)

    if (!info) {
      throw new Error(
        `Collectible with asset index ${assetIndex} not found on blockchain`
      )
    }

    const { signedTransactions, transactionIds } =
      await this.algorand.generateClawbackTransactions({
        assetIndex,
        encryptedMnemonic,
        passphrase,
        fromAccountAddress: info.creator,
      })

    await this.algorand.submitTransaction(signedTransactions)

    const transactions = await AlgorandTransactionModel.query(trx).insert(
      transactionIds.map((id) => ({
        address: id,
        status: AlgorandTransactionStatus.Pending,
      }))
    )

    await CollectibleModel.query(trx).where('id', collectible.id).patch({
      ownerId: userId,
      latestTransferTransactionId: transactions[0].id,
      claimedAt: new Date().toISOString(),
    })

    const ownership = await CollectibleOwnershipModel.query(trx).insert({
      collectibleId: collectible.id,
      ownerId: userId,
    })

    await EventModel.query(trx).insert([
      ...transactions.map((t) => ({
        action: EventAction.Create,
        entityType: EventEntityType.AlgorandTransaction,
        entityId: t.id,
        userAccountId: userId,
      })),
      {
        action: EventAction.Update,
        entityId: collectible.id,
        entityType: EventEntityType.Collectible,
        userAccountId: userId,
      },
      {
        action: EventAction.Create,
        entityId: ownership.id,
        entityType: EventEntityType.CollectibleOwnership,
        userAccountId: userId,
      },
    ])
  }

  async getCollectibles({
    page = 1,
    pageSize = 10,
    locale = DEFAULT_LOCALE,
    sortBy = CollectibleSortField.Title,
    sortDirection = SortDirection.Ascending,
    ownerExternalId,
    ownerUsername,
    templateIds,
    setId,
    collectionId,
  }: CollectibleListQuerystring): Promise<CollectibleListWithTotal | null> {
    const ownerIdentifier = ownerExternalId || ownerUsername
    userInvariant(ownerIdentifier, 'Must specify owner')
    userInvariant(page > 0, 'page must be greater than 0')
    userInvariant(
      pageSize > 0 || pageSize === -1,
      'pageSize must be greater than 0'
    )
    userInvariant(
      [CollectibleSortField.ClaimedAt, CollectibleSortField.Title].includes(
        sortBy
      ),
      'sortBy must be one of claimedAt or title'
    )
    userInvariant(
      [SortDirection.Ascending, SortDirection.Descending].includes(
        sortDirection
      ),
      'sortDirection must be one of asc or desc'
    )

    const field = ownerUsername ? 'username' : 'externalId'
    const account = await UserAccountModel.query()
      .findOne(field, '=', ownerIdentifier)
      .select('id')
    userInvariant(account, 'user not found', 404)

    const total = await CollectibleModel.query()
      .where('ownerId', account.id)
      .count('*', { as: 'count' })
      .first()
      .castTo<{ count: string }>()

    const totalCount = Number.parseInt(total.count, 10)

    if (totalCount === 0) {
      return {
        total: 0,
        collectibles: [],
      }
    }

    const collectibles = await CollectibleModel.query().where({
      ownerId: account.id,
      ...(templateIds
        ? {
            id: {
              _in: templateIds,
            },
          }
        : {}),
    })

    const foundTemplateIds = [...new Set(collectibles.map((c) => c.templateId))]

    const cmsFilter: ItemFilter = {
      id: {
        _in: foundTemplateIds,
      },
    }

    const { collectibles: templates } = await this.cms.findAllCollectibles(
      locale,
      cmsFilter
    )

    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))
    const mappedCollectibles = collectibles
      .map((c) => {
        const template = templateLookup.get(c.templateId)
        invariant(template !== undefined, `template ${c.templateId} not found`)

        return {
          ...template,
          claimedAt:
            c.claimedAt instanceof Date
              ? c.claimedAt.toISOString()
              : c.claimedAt,
          id: c.id,
          address: c.address,
          edition: c.edition,
        } as CollectibleWithDetails
      })
      .filter((collectible) => {
        // need to filter them by set/collection here to avoid invariant error in the .map call above
        if (setId) return collectible.setId === setId
        if (collectionId) return collectible.collectionId === collectionId
        return true
      })
      .sort((a, b) => {
        const direction = sortDirection === SortDirection.Ascending ? 1 : -1
        return direction * (a[sortBy] || '').localeCompare(b[sortBy] || '')
      })

    const collectiblesPage =
      pageSize === -1
        ? mappedCollectibles
        : mappedCollectibles.slice((page - 1) * pageSize, page * pageSize)

    return {
      total: mappedCollectibles.length,
      collectibles: collectiblesPage,
    }
  }

  async getCollectibleTemplates({
    page = 1,
    pageSize = 10,
    locale = DEFAULT_LOCALE,
    sortBy = CollectibleSortField.Title,
    sortDirection = SortDirection.Ascending,
    templateIds = [],
    setId,
    collectionId,
  }: CollectibleListQuerystring): Promise<CollectibleBase[]> {
    userInvariant(page > 0, 'page must be greater than 0')
    userInvariant(
      pageSize > 0 || pageSize === -1,
      'pageSize must be greater than 0'
    )
    userInvariant(
      [CollectibleSortField.ClaimedAt, CollectibleSortField.Title].includes(
        sortBy
      ),
      'sortBy must be one of claimedAt or title'
    )
    userInvariant(
      [SortDirection.Ascending, SortDirection.Descending].includes(
        sortDirection
      ),
      'sortDirection must be one of asc or desc'
    )

    const filter: ItemFilter = {}
    if (templateIds.length > 0) filter.id = { _in: templateIds }
    if (setId) filter.set = { id: setId }
    if (collectionId) filter.collection = { id: collectionId }

    const { collectibles: templates } = await this.cms.findAllCollectibles(
      locale,
      filter
    )

    const collectibles =
      pageSize === -1
        ? templates
        : templates.slice((page - 1) * pageSize, page * pageSize)

    return collectibles
  }

  async getShowcaseCollectibles({
    locale = DEFAULT_LOCALE,
    ownerUsername,
  }: CollectibleShowcaseQuerystring) {
    const user = await UserAccountModel.query()
      .findOne('username', ownerUsername)
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
      locale,
      {
        id: {
          _in: templateIds,
        },
      }
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
    } as CollectibleListShowcase
  }

  async addShowcaseCollectible(
    {
      ownerUsername,
      collectibleId,
    }: {
      ownerUsername: string
      collectibleId: string
    },
    trx?: Transaction
  ) {
    const user = await UserAccountModel.query(trx)
      .findOne('username', ownerUsername)
      .select('id')

    userInvariant(user, 'user not found', 404)

    const collectible = await CollectibleModel.query(trx).findOne({
      ownerId: user.id,
      id: collectibleId,
    })

    userInvariant(collectible, 'collectible not found', 404)

    const showcases = await CollectibleShowcaseModel.query(trx)
      .where('ownerId', user.id)
      .orderBy('order', 'desc')

    const latestShowcase = showcases[0]

    userInvariant(showcases.length <= MAX_SHOWCASES, 'too many showcases')
    userInvariant(
      !showcases.some((s) => s.collectibleId === collectibleId),
      'collectible already in the showcase'
    )

    const newShowcase = await CollectibleShowcaseModel.query(trx).insert({
      collectibleId: collectible.id,
      ownerId: user.id,
      order: latestShowcase ? latestShowcase.order + 1 : 1,
    })

    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.CollectibleShowcase,
      entityId: newShowcase.id,
      userAccountId: user.id,
    })
  }

  async removeShowcaseCollectible(
    {
      ownerUsername,
      collectibleId,
    }: {
      ownerUsername: string
      collectibleId: string
    },
    trx?: Transaction
  ) {
    const user = await UserAccountModel.query(trx)
      .findOne('username', ownerUsername)
      .select('id')

    userInvariant(user, 'user not found', 404)

    const showcaseToBeRemoved = await CollectibleShowcaseModel.query(
      trx
    ).findOne({
      ownerId: user.id,
      collectibleId: collectibleId,
    })

    userInvariant(showcaseToBeRemoved, 'collectible not found', 404)

    await CollectibleShowcaseModel.query(trx)
      .where('id', showcaseToBeRemoved.id)
      .delete()

    await EventModel.query(trx).insert({
      action: EventAction.Delete,
      entityType: EventEntityType.CollectibleShowcase,
      entityId: showcaseToBeRemoved.id,
      userAccountId: user.id,
    })

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
        await EventModel.query(trx).insert({
          action: EventAction.Update,
          entityType: EventEntityType.CollectibleShowcase,
          entityId: showcase.id,
          userAccountId: user.id,
        })
      })
    )
  }
}
