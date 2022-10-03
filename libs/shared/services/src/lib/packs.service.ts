import {
  BidPublic,
  ClaimFreePack,
  ClaimRedeemPack,
  CollectibleWithDetails,
  DEFAULT_LANG,
  NotificationType,
  PackAuction,
  PackBase,
  PackByOwner,
  PacksByOwner,
  PacksByOwnerQuery,
  PackSortByOwnerField,
  PackSortField,
  PackStatus,
  PackType,
  PackWithCollectibles,
  PackWithId,
  PublishedPack,
  PublishedPacksQuery,
  RevokePack,
  SortDirection,
  TransferPackStatusList,
  UserAccount,
} from '@algomart/schemas'
import {
  BidModel,
  CMSCachePackTemplateModel,
  PackModel,
  UserAccountModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import { ClaimPackQueue } from '@algomart/shared/queues'
import { invariant, isAfterNow, userInvariant } from '@algomart/shared/utils'
import { Model, raw, Transaction } from 'objection'
import pino from 'pino'

import { CMSCacheService, ItemFilters, toPackBase } from './cms-cache.service'
import { CollectiblesService } from './collectibles.service'
import { NotificationsService } from './notifications.service'

function mapToPublicBid(bid: BidModel, packId: string): BidPublic {
  return {
    amount: bid.amount,
    createdAt: bid.createdAt,
    userExternalId: bid?.userAccount?.externalId as string,
    id: bid.id,
    packId,
    username: bid?.userAccount?.username as string,
  }
}

export class PacksService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheService,
    private readonly collectibles: CollectiblesService,
    private readonly notifications: NotificationsService,
    private readonly claimPackQueue: ClaimPackQueue,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  private createPublishedPackFn(
    packLookup: Map<
      string,
      { templateId: string; available: string; total: string }
    >,
    packWithActiveBidsLookup: Map<string, PackModel>
  ) {
    return (template: PackBase): PublishedPack => {
      const packCount = packLookup.get(template.templateId)
      const packWithActiveBid = packWithActiveBidsLookup.get(
        template.templateId
      )

      return this.createPublishedPack(template, packCount, packWithActiveBid)
    }
  }

  private createPublishedPack(
    template: PackBase,
    packCount,
    packWithActiveBid
  ) {
    const available = packCount ? Number.parseInt(packCount.available, 10) : 0
    const total = packCount ? Number.parseInt(packCount.total, 10) : 0
    const status =
      template.type !== PackType.Auction && !available
        ? PackStatus.Expired
        : template.status
    return {
      ...template,
      status,
      available,
      total,
      activeBid: (packWithActiveBid?.activeBid?.amount as number) ?? undefined,
    }
  }

  private async getPacksWithActiveBids(templateIds: string[]) {
    return await PackModel.query()
      .whereIn('templateId', templateIds)
      .withGraphFetched('activeBid')
  }

  private async getPackCounts(
    templateIds: string[]
  ): Promise<Array<{ templateId: string; available: string; total: string }>> {
    return await PackModel.query()
      .whereIn('templateId', templateIds)
      .groupBy('templateId')
      .select(
        'templateId',
        // Get available count
        raw(
          'SUM(CASE WHEN "claimedAt" IS NULL THEN 1 ELSE 0 END) AS "available"'
        ),
        // Get total number of packs
        raw('COUNT(*) AS "total"')
      )
      // This is needed to ensure the correct types are used
      .castTo<Array<{ templateId: string; available: string; total: string }>>()
      .execute()
  }

  // #endregion

  async getPublishedPacksByTemplates(templates: PackBase[]) {
    const packCounts = await this.getPackCounts(
      templates.map((t) => t.templateId)
    )
    const assemblePack = this.createPublishedPackFn(
      new Map(packCounts.map((p) => [p.templateId, p])),
      new Map()
    )

    return templates.map((pack) => assemblePack(pack))
  }

  async getPublishedPackBySlug(slug, language = DEFAULT_LANG) {
    const template = await this.cms.findPackBySlug(slug, language)
    const [packCount] = await this.getPackCounts([template.templateId])

    return this.createPublishedPack(template, packCount, null)
  }

  async searchPublishedPacks({
    language = DEFAULT_LANG,
    page = 1,
    pageSize = 10,
    type = [],
    priceHigh, // in USD cents
    priceLow, // in USD cents
    tags = [],
    status = [],
    sortBy = PackSortField.ReleasedAt,
    sortDirection = SortDirection.Descending,
  }: PublishedPacksQuery): Promise<{ packs: PublishedPack[]; total: number }> {
    userInvariant(page > 0, 'page must be greater than 0', 400)
    userInvariant(
      priceHigh === undefined ||
        priceLow === undefined ||
        (priceHigh >= priceLow && priceLow >= 0),
      'priceHigh must be greater than priceLow',
      400
    )

    // Page is zero-based in our query but one-based in the request
    page = page - 1
    // Page size can be -1 up to MAX_SAFE_INTEGER
    pageSize = Math.min(Math.max(-1, pageSize), Number.MAX_SAFE_INTEGER)
    // Page size -1 means no limit, grab all packs
    if (pageSize === -1) pageSize = Number.MAX_SAFE_INTEGER

    // Setup base query
    let queryBuilder = PackModel.query()
      .select(
        'CmsCachePackTemplates.id',
        // This is used to feed toPackBase later
        'CmsCachePackTemplates.content',
        // Needed for auction packs
        'Bid.amount AS activeBidAmount',
        // Calculate number of available packs
        raw(
          'SUM(CASE WHEN "Pack"."ownerId" IS NULL THEN 1 ELSE 0 END) as "available"'
        ),
        // Total packs for a single pack template
        raw('COUNT("Pack".*) AS "total"')
      )
      // Need to group by for the SUM/COUNT in the select
      .groupBy(
        'CmsCachePackTemplates.id',
        'CmsCachePackTemplates.content',
        'CmsCachePackTemplates.releasedAt',
        'Bid.amount'
      )
      // Should be safe, this should have been validated by the JSON schema
      .orderBy(sortBy, sortDirection)
      .page(page, pageSize)
      // Mostly for TypeScript to get the right types
      .castTo<{
        total: number
        results: Array<
          Pick<CMSCachePackTemplateModel, 'content'> & {
            activeBidAmount: number | null
            available: number
            total: number
          }
        >
      }>()

    queryBuilder =
      tags.length > 0
        ? queryBuilder.joinRaw(
            'INNER JOIN search_pack_templates(?) AS "CmsCachePackTemplates" ON "CmsCachePackTemplates".id = "Pack"."templateId"',
            [tags]
          ) // Left join to ensure packs without bids are still included
        : queryBuilder.leftJoin(
            'CmsCachePackTemplates',
            'CmsCachePackTemplates.id',
            'Pack.templateId'
          ) // Left join to ensure packs without bids are still included

    queryBuilder = queryBuilder.leftJoin('Bid', 'Pack.activeBidId', 'Bid.id')

    if (priceHigh !== undefined || priceLow !== undefined) {
      // Add price filter
      queryBuilder.where((priceQuery) => {
        if (priceHigh !== undefined && priceLow !== undefined) {
          priceQuery.whereBetween('price', [priceLow, priceHigh])
        } else if (priceHigh !== undefined) {
          priceQuery.where('price', '<=', priceHigh)
        } else if (priceLow !== undefined) {
          priceQuery.where('price', '>=', priceLow)
        }

        return priceQuery.orWhereNull('price')
      })
    }

    if (type.length > 0) {
      // Add type filter
      queryBuilder.whereIn('type', type)
    }

    if (status.length > 0) {
      queryBuilder.where((builder) => {
        return (
          builder
            // Status filter is mostly for auction packs, so we ignore it for non-auction packs
            .orWhereIn('type', [
              PackType.Free,
              PackType.Purchase,
              PackType.Redeem,
            ])
            .orWhere((statusQuery) => {
              if (status.includes(PackStatus.Upcoming)) {
                statusQuery.orWhere('releasedAt', '>', new Date())
              }

              if (status.includes(PackStatus.Expired)) {
                statusQuery.orWhere('auctionUntil', '<', new Date())
              }

              if (status.includes(PackStatus.Active)) {
                statusQuery.orWhere((inner) => {
                  inner.where('auctionUntil', '>=', new Date())
                  inner.where('releasedAt', '<=', new Date())
                })
              }
            })
        )
      })
    }

    // Run query
    const result = await queryBuilder

    return {
      packs: result.results.map((t) => {
        const base = toPackBase(t.content, this.cms.options, language, false)

        // Remap status for sold out non-auction packs
        const status =
          t.content.type !== PackType.Auction && t.available === 0
            ? PackStatus.Expired
            : base.status

        return {
          ...base,
          status,
          available: t.available,
          activeBid: t.activeBidAmount ?? undefined,
          total: t.total,
        }
      }),
      total: result.total,
    }
  }

  async getPacksByOwner(
    user: UserAccount,
    {
      language = DEFAULT_LANG,
      page = 1,
      pageSize = 10,
      templateIds = [],
      slug,
      type = [],
      sortBy = PackSortByOwnerField.ClaimedAt,
      sortDirection = SortDirection.Ascending,
    }: PacksByOwnerQuery
  ): Promise<PacksByOwner> {
    invariant(page > 0, 'page must be greater than 0')

    const filter: ItemFilters = {}
    if (slug) filter.slug = { _eq: slug }
    if (templateIds.length > 0) filter.id = { _in: templateIds }
    if (type.length > 0) filter.type = { _in: type }

    // Find packs by owner ID
    const packsByOwnerId: PackModel[] = await PackModel.query().where(
      'ownerId',
      user.id
    )
    const packsIdsByOwnerId = packsByOwnerId.map(({ templateId }) => templateId)
    if (packsIdsByOwnerId.length === 0) {
      return {
        packs: [],
        total: 0,
      }
    }

    // If template IDs are provided, create intersection of IDs.
    let templateIdsForOwner: string[] = []
    if (templateIds.length > 0) {
      templateIdsForOwner = packsIdsByOwnerId.filter((id) =>
        templateIds.includes(id)
      )

      // User doesn't own any of the packs in provided template IDs
      if (templateIdsForOwner.length === 0) {
        return {
          packs: [],
          total: 0,
        }
      }
    }

    // If templateIdsForOwner has matches use the intersecting ids. Otherwise use owner's pack IDs.
    filter.id =
      templateIdsForOwner.length > 0
        ? { _in: templateIdsForOwner }
        : { _in: packsIdsByOwnerId }

    // Find templates for the packs owned by user
    const { packs: templates } = await this.cms.findAllPacks({
      language,
      pageSize: -1,
      filter,
    })
    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))

    let packsWithActiveBids: PackModel[] = []

    if (type.length === 0 || type.includes(PackType.Auction)) {
      // only load bids when searching for auction packs
      packsWithActiveBids = await this.getPacksWithActiveBids(
        templates
          .filter((t) => t.type === PackType.Auction)
          .map((t) => t.templateId)
      )
    }

    const packWithActiveBidsLookup = new Map(
      packsWithActiveBids.map((p) => [p.templateId, p])
    )

    // List packs purchased by owner with template details
    const allPacks: PackByOwner[] = []
    for (const { id, claimedAt, templateId } of packsByOwnerId) {
      const template = templateLookup.get(templateId)
      if (template && claimedAt) {
        const packWithActiveBid = packWithActiveBidsLookup.get(templateId)
        allPacks.push({
          ...template,
          id,
          status: template.status,
          claimedAt,
          activeBid:
            (packWithActiveBid?.activeBid?.amount as number) ?? undefined,
        })
      }
    }

    // Sort packs
    const sortedPacks = allPacks.sort((a: PackByOwner, b: PackByOwner) => {
      const direction = sortDirection === SortDirection.Ascending ? 1 : -1
      switch (sortBy) {
        case PackSortByOwnerField.ClaimedAt: {
          const isAfterDate =
            new Date(a.claimedAt).getTime() > new Date(b.claimedAt).getTime()
          return direction * (isAfterDate ? 1 : -1)
        }
        default:
          return 0
      }
    })

    return {
      packs: sortedPacks.slice((page - 1) * pageSize, page * pageSize),
      total: sortedPacks.length,
    }
  }

  async getPackWithCollectiblesById(
    id: string,
    language = DEFAULT_LANG
  ): Promise<PackWithCollectibles> {
    const pack = await PackModel.query()
      .findOne({ id })
      .withGraphFetched('collectibles')

    userInvariant(pack, 'pack not found', 404)
    invariant(pack.collectibles, 'pack collectibles were not fetched')
    invariant(pack.collectibles.length > 0, 'pack has no collectibles')

    const packTemplate = await this.cms.findPackByTemplateId(
      pack.templateId,
      language
    )
    invariant(packTemplate, 'pack template missing in cms')

    const templateIds = pack.collectibles.map((c) => c.templateId)
    const collectibleTemplates = await this.cms.findCollectiblesByTemplateIds(
      templateIds,
      language
    )

    const collectibleTemplateLookup = new Map(
      collectibleTemplates.map((t) => [t.templateId, t])
    )

    return {
      ...packTemplate,
      id: pack.id,
      collectibles: pack.collectibles.map((c): CollectibleWithDetails => {
        const template = collectibleTemplateLookup.get(c.templateId)
        invariant(template, 'collectible template missing in cms')

        return {
          ...template,
          id: c.id,
          claimedAt:
            c.claimedAt instanceof Date
              ? c.claimedAt.toISOString()
              : c.claimedAt ?? undefined,
          edition: c.edition,
          address: c.address ?? undefined,
        }
      }),
    }
  }

  async getAuctionPackByTemplateId(
    templateId: string
  ): Promise<PackAuction | null> {
    const pack = await PackModel.query()
      .where({ templateId })
      .withGraphFetched('activeBid.userAccount')
      .withGraphFetched('bids.userAccount')
      .withGraphFetched('owner')
      .first()

    if (!pack) {
      this.logger.info('pack with templateId %s not found', templateId)
      return null
    }

    return {
      activeBid: pack?.activeBid?.userAccount?.externalId
        ? mapToPublicBid(pack.activeBid, pack.id)
        : undefined,
      bids:
        pack?.bids
          ?.map((bid) => mapToPublicBid(bid, pack.id))
          .sort((a, b) => {
            return (
              new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf()
            )
          }) || [],
      userExternalId: pack.owner?.externalId ?? undefined,
      packId: pack.id,
    }
  }

  async getPackById(
    id: string,
    language = DEFAULT_LANG
  ): Promise<PackWithId | null> {
    const pack = await PackModel.query().where({ id }).first()

    if (!pack) {
      this.logger.info('pack with id %s not found', id)
      return null
    }

    const template = await this.cms.findPackByTemplateId(
      pack.templateId,
      language
    )

    if (!template) {
      throw new Error(`pack template with ID ${pack.templateId} not found`)
    }

    return { ...template, id: pack.id, ownerId: pack.ownerId }
  }

  async getPackByRedeemCode(
    redeemCode: string,
    language = DEFAULT_LANG
  ): Promise<PackWithId> {
    const pack = await PackModel.query().where({ redeemCode }).first()
    userInvariant(pack && pack.ownerId === null, 'pack not found', 404)

    const template = await this.cms.findPackByTemplateId(
      pack.templateId,
      language
    )

    invariant(template, 'pack template not in cms')
    invariant(template.type === PackType.Redeem, 'pack not redeemable in cms')

    return {
      ...template,
      id: pack.id,
    }
  }

  async transferPackStatus(
    user: UserAccount,
    packId: string
  ): Promise<TransferPackStatusList> {
    const pack: PackModel | undefined = await PackModel.query()
      .findOne('Pack.id', packId)
      .where('Pack.ownerId', user.id)
      .withGraphJoined('collectibles.latestTransferTransaction')

    userInvariant(pack, 'pack not found', 404)
    invariant(pack.collectibles, 'pack has no collectibles')

    return {
      status: pack.collectibles.map((collectible) => ({
        collectibleId: collectible.id,
        status: collectible.latestTransferTransaction?.status,
      })),
    }
  }

  // Used by endpoint: /claim/free
  async claimRandomFreePack(user: UserAccount, request: ClaimFreePack) {
    const pack = await this.reserveFreePack({
      templateId: request.templateId,
      userId: user.id,
    })

    // Queue the claim-pack job.
    // If there's an error submitting the job, revert the claim.
    //
    // Note: It's probably possible in theory that a job could be queued even if an exception is caught.
    // (some kind of connection issue after the job is queued but before bull-mq hears back from redis)
    // We are not currently handing this scenario and are not particularly worried about it occurring.
    try {
      await this.startPackTransfer(pack.id)
    } catch (error) {
      this.logger.error(error)
      await this.clearPackOwner(pack.id, user.id)
      // Note: It's possible that there's an error while reverting the claim. If this happens,
      // pack transfer will remain as "claimed" indefinitely but the minting/ transfers will not actually occur
      throw error
    }

    const result = await this.getPackById(pack.id)
    return result
  }

  // reserves a free pack for a given user and runs assertions during update
  async reserveFreePack({
    templateId,
    userId,
  }: {
    templateId: string
    userId: string
  }) {
    // The pack template fields that we're asserting against here can't be changed after they're initially set,
    // so it's safe to run these assertions ahead of the update. All other types of assertions need to be made in
    // the update query itself.
    const freePackTemplate = await CMSCachePackTemplateModel.query()
      .where('id', templateId)
      .where('type', PackType.Free)
      .whereNotNull('releasedAt')
      .first()

    userInvariant(
      freePackTemplate,
      'No released/free pack template found for provided template ID',
      404
    )

    userInvariant(
      !isAfterNow(new Date(freePackTemplate.releasedAt)),
      'Pack has not been released yet'
    )

    let findRandomUnclaimedPackId = PackModel.query()
      .select('id')
      .where({
        templateId,
        ownerId: null,
        claimedAt: null,
        redeemCode: null,
      })
      .orderBy(raw('random()'))
      .limit(1)

    const onePackPerCustomer = freePackTemplate.content.one_pack_per_customer

    if (onePackPerCustomer) {
      findRandomUnclaimedPackId = findRandomUnclaimedPackId.whereNotExists(
        PackModel.query().findOne({ ownerId: userId, templateId })
      )
    }

    const claimedAt = new Date().toISOString()
    const result = await PackModel.query()
      .whereIn(
        'id',
        // this query will return no results (so no update will occur) if there's no
        // packs left without an owner (it also checks the one-pack-per customer rule
        // if it's set for this template
        findRandomUnclaimedPackId
      )
      .patch({
        // update will fail due to FK constraint if userId does not point to a real user account row
        ownerId: userId,
        updatedAt: claimedAt,
        claimedAt,
      })
      .returning('*')

    const pack = result[0]

    userInvariant(
      !!pack,
      'Unable to claim a free pack for this user/ template',
      404
    )

    return pack
  }

  async startPackTransfer(packId: string) {
    await this.claimPackQueue.enqueue({ packId })
  }

  private async reserveRedeemablePack(
    userId: string,
    redeemCode: string
  ): Promise<PackModel> {
    const findPack = PackModel.query()
      .where({
        claimedAt: null,
        ownerId: null,
        redeemCode,
      })
      .first()

    let pack = await findPack
    userInvariant(
      pack,
      'No unclaimed pack found with provided redemption code',
      404
    )

    const redeemPackTemplate = await CMSCachePackTemplateModel.query()
      .where('id', pack.templateId)
      .where('type', PackType.Redeem)
      .whereNotNull('releasedAt')
      .first()

    userInvariant(
      redeemPackTemplate,
      'No released/redeemable pack template found for pack with provided redemption code',
      404
    )

    userInvariant(
      !isAfterNow(new Date(redeemPackTemplate.releasedAt)),
      'Pack has not been released yet'
    )

    let findPackId = findPack.select('id')
    const onePackPerCustomer = redeemPackTemplate.content.one_pack_per_customer

    if (onePackPerCustomer) {
      findPackId = findPackId.whereNotExists(
        PackModel.query().findOne({
          ownerId: userId,
          templateId: redeemPackTemplate.id,
        })
      )
    }

    const claimedAt = new Date().toISOString()
    pack = null
    pack = await PackModel.query()
      .whereIn('id', findPackId)
      .patch({
        ownerId: userId,
        updatedAt: claimedAt,
        claimedAt,
      })
      .returning('*')
      .first()

    userInvariant(
      pack,
      'Unable to claim a pack for this user/ redemption code',
      404
    )

    return pack
  }

  async claimRedeemablePack(
    user: UserAccount,
    { redeemCode }: ClaimRedeemPack
  ) {
    const pack = await this.reserveRedeemablePack(user.id, redeemCode)

    userInvariant(pack, 'Unable to claim redeemable pack', 400)

    // Queue the claim-pack job.
    // If there's an error submitting the job, revert the claim.
    //
    // Note: It's probably possible in theory that a job could be queued even if an exception is caught.
    // (some kind of connection issue after the job is queued but before bull-mq hears back from redis)
    // We are not currently handing this scenario and are not particularly worried about it occurring.
    try {
      await this.startPackTransfer(pack.id)
    } catch (error) {
      this.logger.error(error)
      await this.clearPackOwner(pack.id, user.id)
      // Note: It's possible that there's an error while reverting the claim. If this happens,
      // pack transfer will remain as "claimed" indefinitely but the minting/ transfers will not actually occur
      throw error
    }

    const result = await this.getPackById(pack.id)
    return result
  }

  async reservePackByTemplateId(
    packTemplateId: string,
    user: UserAccount,
    trx?: Transaction,
    unifiedFlow = false
  ) {
    // there's no real need for a transaction here, but we'd like to support the parent
    // function providing a transaction if it needs to use this function in composition
    // with other database operations
    const innerTrx = trx ?? (await Model.startTransaction())
    let pack: PackModel
    try {
      // The pack template fields that we're asserting against here can't be changed after they're initially set,
      // so it's safe to run these assertions ahead of the update. All other types of assertions need to be made in
      // the update query itself.
      const purchasePackTemplate = await CMSCachePackTemplateModel.query(
        innerTrx
      )
        .where('id', packTemplateId)
        .where('type', PackType.Purchase)
        .whereNotNull('releasedAt')
        .first()

      userInvariant(
        !isAfterNow(new Date(purchasePackTemplate.releasedAt)),
        'Pack has not been released yet'
      )

      userInvariant(
        purchasePackTemplate,
        'No released/purchasable pack template found for provided template ID',
        404
      )

      let findRandomUnclaimedPackId = PackModel.query(innerTrx)
        .alias('p')
        .join('CmsCachePackTemplates AS t', 'p.templateId', 't.id')
        .select('p.id')
        .where({
          't.type': PackType.Purchase,
          'p.templateId': packTemplateId,
          'p.ownerId': null,
          'p.claimedAt': null,
        })

      // If we're in the unified purchase flow we'll be reserving a pack before they have a balance
      // So we only want to check price against balance if we're doing a direct credits purchase
      if (!unifiedFlow) {
        // We acknowledge that there's a potential race condition wherein
        // the users balance can change between the time `user` is read and the time
        // that this query is executed, but this method is faster than reading the user
        // in the same query and at the end of the day it's the job of Circle to make sure
        // users cant overdraft their account.
        //
        // When the credits transfer is attempted, if the user doesn't have enough funds, the
        // claim will be reverted and no assets will be minted.
        findRandomUnclaimedPackId.where('t.price', '<=', user.balance)
      }

      findRandomUnclaimedPackId.orderBy(raw('random()')).limit(1)

      const onePackPerCustomer =
        purchasePackTemplate.content.one_pack_per_customer

      if (onePackPerCustomer) {
        findRandomUnclaimedPackId = findRandomUnclaimedPackId.whereNotExists(
          PackModel.query(innerTrx).findOne({
            ownerId: user.id,
            templateId: packTemplateId,
          })
        )
      }

      const claimedAt = new Date().toISOString()
      const result = await PackModel.query(innerTrx)
        .whereIn(
          'id',
          // this query will return no results (so no update will occur) if there's no
          // packs left without an owner (it also checks the one-pack-per customer rule
          // if it's set for this template and the user balance)
          findRandomUnclaimedPackId
        )
        .patch({
          ownerId: user.id,
          updatedAt: claimedAt,
          claimedAt,
        })
        .returning('*')

      pack = result[0]

      userInvariant(
        !!pack,
        'Unable to claim a pack for this user/ template',
        404
      )

      if (!trx) await innerTrx.commit()
    } catch (error) {
      if (!trx) await innerTrx.rollback()
      throw error
    }
    return pack
  }

  async clearPackOwner(
    packId: string,
    userId: string,
    trx: Transaction = null
  ) {
    const innerTrx = trx ?? (await Model.startTransaction())
    try {
      const updatedAt = new Date().toISOString()

      const pack = await PackModel.query(innerTrx)
        .where('id', packId)
        .where('ownerId', userId)

      if (pack) {
        await PackModel.query(innerTrx).patch({
          ownerId: null,
          claimedAt: null,
          updatedAt,
        })
      }
      if (!trx) {
        await innerTrx.commit()
      }
    } catch (error) {
      if (!trx) {
        await innerTrx.rollback()
      }
      throw error
    }
  }

  async clearPackOwnerAndMarkCreditsTransferJobComplete({
    transferId,
    packId,
    userId,
  }: {
    transferId: string
    packId: string
    userId: string
  }) {
    // technically it's possible for this function to be called multiple times in a race condition
    // in which case the queries will run multiple times, but thats ok
    const trx = await Model.startTransaction()
    try {
      await this.clearPackOwner(packId, userId, trx)
      await UserAccountTransferModel.query(trx)
        .where({ id: transferId })
        .patch({ creditsTransferJobCompletedAt: new Date().toISOString() })
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async revokePack(request: RevokePack) {
    invariant(
      request.fromAddress || request.ownerId,
      'Pack owner ID or address is required.'
    )
    let userId: string

    if (request.ownerId) {
      const user = await UserAccountModel.query().findById(request.ownerId)
      userInvariant(user, 'user not found', 404)
      userId = user.id
    }

    const packQuery = PackModel.query().where('id', request.packId)

    if (userId) {
      packQuery.where('ownerId', request.ownerId)
    }

    const pack = await packQuery
      .select('id')
      .withGraphFetched('collectibles')
      .modifyGraph('collectibles', (builder) => {
        builder.select('id')
      })
      .first()

    userInvariant(pack, 'pack not found', 404)

    this.logger.info({ pack }, 'pack to be transferred')

    // Transfer
    await Promise.all(
      pack?.collectibles?.map(
        async (c) =>
          c.ownerId &&
          c.id &&
          (await this.collectibles.transferToCreatorFromUser(
            c.id,
            request.fromAddress,
            userId
          ))
      )
    )

    // Create transfer success notification to be sent to user
    const packWithBase = await this.getPackById(request.packId)
    if (packWithBase) {
      await this.notifications.createNotification({
        type: NotificationType.PackRevoked,
        userAccountId: request.ownerId,
        variables: {
          packTitle: packWithBase.title,
        },
      })
    }

    return await this.clearPackOwner(request.packId, userId)
  }
}
