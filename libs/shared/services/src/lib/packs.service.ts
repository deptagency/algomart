import * as Currencies from '@dinero.js/currencies'
import pino from 'pino'

import {
  BidPublic,
  ClaimFreePack,
  ClaimPack,
  ClaimRedeemPack,
  CollectibleWithDetails,
  DEFAULT_LOCALE,
  DirectusStatus,
  EventAction,
  EventEntityType,
  IPFSStatus,
  LocaleAndExternalId,
  MintPack,
  MintPackStatus,
  NotificationType,
  OwnerExternalId,
  PackAuction,
  PackBase,
  PackByOwner,
  PackCollectibleOrder,
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
  TransferPack,
  TransferPackStatusList,
} from '@algomart/schemas'
import { Knex } from 'knex'
import { raw, Transaction } from 'objection'

import I18nService from './i18n.service'

import { CMSCacheAdapter, ItemFilter } from '@algomart/shared/adapters'

import NotificationsService from './notifications.service'
import CollectiblesService from './collectibles.service'
import AccountsService from './accounts.service'

import {
  UserAccountModel,
  BidModel,
  EventModel,
  PackModel,
  CollectibleModel,
  CollectibleOwnershipModel,
} from '@algomart/shared/models'

import {
  formatIntToFloat,
  invariant,
  userInvariant,
  randomInteger,
  randomRedemptionCode,
  shuffleArray,
} from '@algomart/shared/utils'

interface PackFilters {
  priceLow: number
  priceHigh: number
  status: PackStatus[]
  reserveMet?: boolean
}

function shouldIncludeAuctionPack(
  pack: PublishedPack,
  filters: PackFilters
): boolean {
  let include = true

  if (typeof pack.activeBid === 'number') {
    include =
      include &&
      pack.activeBid >= filters.priceLow &&
      pack.activeBid <= filters.priceHigh
  }

  if (filters.status.length > 0) {
    include = include && filters.status.includes(pack.status)
  }

  if (typeof filters.reserveMet === 'boolean') {
    include = filters.reserveMet
      ? include &&
        typeof pack.activeBid === 'number' &&
        pack.price !== null &&
        pack.activeBid >= pack.price
      : include &&
        (pack.price === null ||
          pack.activeBid === undefined ||
          pack.activeBid < pack.price)
  }

  return include
}

function shouldIncludePurchasePack(
  pack: PublishedPack,
  filters: PackFilters
): boolean {
  return pack.price >= filters.priceLow && pack.price <= filters.priceHigh
}

function mapToPublicBid(bid: BidModel, packId: string): BidPublic {
  return {
    amount: bid.amount,
    createdAt: bid.createdAt,
    externalId: bid?.userAccount?.externalId as string,
    id: bid.id,
    packId,
    username: bid?.userAccount?.username as string,
  }
}

export default class PacksService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheAdapter,
    private readonly collectibles: CollectiblesService,
    private readonly i18nService: I18nService,
    private readonly notifications: NotificationsService,
    private readonly accounts: AccountsService,
    private currency: Currencies.Currency<number>,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  // #region Private helpers

  private createPackSortFn(sort: {
    sortBy: PackSortField
    sortDirection: SortDirection
  }) {
    return (a: PublishedPack, b: PublishedPack) => {
      const direction = sort.sortDirection === SortDirection.Ascending ? 1 : -1

      switch (sort.sortBy) {
        case PackSortField.Title:
          return direction * a.title.localeCompare(b.title)
        case PackSortField.ReleasedAt:
          return (
            direction * (a.releasedAt?.localeCompare(b.releasedAt ?? '') ?? 0)
          )
        default:
          return 0
      }
    }
  }

  private createPackFilterFn(filters: PackFilters) {
    return (pack: PublishedPack) => {
      if (pack.total === 0) {
        // still waiting for NFTs to be minted
        return false
      }

      if (pack.type === PackType.Auction) {
        return shouldIncludeAuctionPack(pack, filters)
      }

      if (pack.type === PackType.Purchase) {
        return shouldIncludePurchasePack(pack, filters)
      }

      return true
    }
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

  private async getPacksWithActiveBids(templateIds: string[], knexRead?: Knex) {
    return await PackModel.query(knexRead)
      .whereIn('templateId', templateIds)
      .withGraphFetched('activeBid')
  }

  private async getPackCounts(
    templateIds: string[],
    knexRead?: Knex
  ): Promise<Array<{ templateId: string; available: string; total: string }>> {
    return await PackModel.query(knexRead)
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

  async getPublishedPacksByTemplateIds(
    templateIds,
    locale = DEFAULT_LOCALE,
    knexRead?: Knex
  ) {
    const templates = await this.cms.findPacksByTemplateIds(
      templateIds,
      locale,
      knexRead
    )
    const packCounts = await this.getPackCounts(
      templates.map((t) => t.templateId)
    )
    const assemblePack = this.createPublishedPackFn(
      new Map(packCounts.map((p) => [p.templateId, p])),
      new Map()
    )

    return templates.map((pack) => assemblePack(pack))
  }

  async getPublishedPacksByTemplates(templates, knexRead?: Knex) {
    const packCounts = await this.getPackCounts(
      templates.map((t) => t.templateId),
      knexRead
    )
    const assemblePack = this.createPublishedPackFn(
      new Map(packCounts.map((p) => [p.templateId, p])),
      new Map()
    )

    return templates.map((pack) => assemblePack(pack))
  }

  async getPublishedPackBySlug(slug, locale = DEFAULT_LOCALE, knexRead?: Knex) {
    const template = await this.cms.findPackBySlug(slug, locale, knexRead)
    const packCount = (await this.getPackCounts([template.templateId]))[0]

    return this.createPublishedPack(template, packCount, null)
  }

  async searchPublishedPacks(
    {
      currency = this.currency.code,
      locale = DEFAULT_LOCALE,
      page = 1,
      pageSize = 10,
      type = [],
      status = [],
      priceHigh = Number.POSITIVE_INFINITY,
      priceLow = 0,
      reserveMet,
      sortBy = PackSortField.Title,
      sortDirection = SortDirection.Ascending,
    }: PublishedPacksQuery,
    trx?: Transaction,
    knexRead?: Knex
  ): Promise<{ packs: PublishedPack[]; total: number }> {
    invariant(page > 0, 'page must be greater than 0')

    let packTemplates = []

    // TODO: Convert this lookup into a DB query
    const { packs: templates } = await this.cms.findAllPacks({
      locale: locale,
      pageSize: pageSize,
    })
    packTemplates = templates

    const packCounts = await this.getPackCounts(
      packTemplates.map((t) => t.templateId),
      knexRead
    )

    let packsWithActiveBids: PackModel[] = []

    if (type.length === 0 || type.includes(PackType.Auction)) {
      // only load bids when searching for auction packs
      packsWithActiveBids = await this.getPacksWithActiveBids(
        packTemplates
          .filter((t) => t.type === PackType.Auction)
          .map((t) => t.templateId),
        knexRead
      )
    }

    const packLookup = new Map(packCounts.map((p) => [p.templateId, p]))
    const packWithActiveBidsLookup = new Map(
      packsWithActiveBids.map((p) => [p.templateId, p])
    )

    if (currency !== this.currency.code) {
      const { exchangeRate } = await this.i18nService.getCurrencyConversion(
        {
          sourceCurrency: currency,
          targetCurrency: this.currency.code,
        },
        trx,
        knexRead
      )

      priceHigh *= exchangeRate
      priceLow *= exchangeRate
    }

    const filterPack = this.createPackFilterFn({
      priceHigh,
      priceLow,
      status,
      reserveMet,
    })

    const sortPack = this.createPackSortFn({
      sortBy,
      sortDirection,
    })

    const assemblePack = this.createPublishedPackFn(
      packLookup,
      packWithActiveBidsLookup
    )

    const allPublicPacks = packTemplates
      .map((pack) => assemblePack(pack))
      .filter((pack) => filterPack(pack))
      .sort(sortPack)

    return {
      packs: allPublicPacks,
      total: allPublicPacks.length,
    }
  }

  async getPacksByOwner(
    {
      locale = DEFAULT_LOCALE,
      page = 1,
      pageSize = 10,
      templateIds = [],
      slug,
      type = [],
      sortBy = PackSortByOwnerField.ClaimedAt,
      sortDirection = SortDirection.Ascending,
      ownerExternalId,
    }: PacksByOwnerQuery & OwnerExternalId,
    knexRead?: Knex
  ): Promise<PacksByOwner> {
    invariant(page > 0, 'page must be greater than 0')
    invariant(ownerExternalId, 'owner ID is required')

    const filter: ItemFilter = {
      status: {
        _eq: DirectusStatus.Published,
      },
    }
    if (slug) filter.slug = { _eq: slug }
    if (templateIds.length > 0) filter.id = { _in: templateIds }
    if (type.length > 0) filter.type = { _in: type }

    // Find owner's user ID from provided external ID
    const user = await UserAccountModel.query()
      .where('externalId', ownerExternalId)
      .first()
      .select('id')
    invariant(user, 'user not found')

    // Find packs by owner ID
    const packsByOwnerId: PackModel[] = await PackModel.query(knexRead).where(
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
      locale,
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
          .map((t) => t.templateId),
        knexRead
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
    locale = DEFAULT_LOCALE,
    knexRead?: Knex
  ): Promise<PackWithCollectibles> {
    const pack = await PackModel.query(knexRead)
      .findOne({ id })
      .withGraphFetched('collectibles')

    userInvariant(pack, 'pack not found', 404)
    invariant(pack.collectibles, 'pack collectibles were not fetched')
    invariant(pack.collectibles.length > 0, 'pack has no collectibles')

    const packTemplate = await this.cms.findPackByTemplateId(
      pack.templateId,
      locale
    )
    invariant(packTemplate, 'pack template missing in cms')

    const templateIds = pack.collectibles.map((c) => c.templateId)
    const collectibleTemplates = await this.cms.findCollectiblesByTemplateIds(
      templateIds,
      locale,
      knexRead
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
    templateId: string,
    knexRead?: Knex
  ): Promise<PackAuction | null> {
    const pack = await PackModel.query(knexRead)
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
      ownerExternalId: pack.owner?.externalId ?? undefined,
      packId: pack.id,
    }
  }

  async getPackById(
    id: string,
    knexRead?: Knex,
    locale = DEFAULT_LOCALE
  ): Promise<PackWithId | null> {
    const pack = await PackModel.query(knexRead).where({ id }).first()

    if (!pack) {
      this.logger.info('pack with id %s not found', id)
      return null
    }

    const template = await this.cms.findPackByTemplateId(
      pack.templateId,
      locale
    )

    if (!template) {
      throw new Error(`pack template with ID ${pack.templateId} not found`)
    }

    return { ...template, id: pack.id }
  }

  async getPackByRedeemCode(
    redeemCode: string,
    knexRead?: Knex,
    locale = DEFAULT_LOCALE
  ): Promise<PackWithId> {
    const pack = await PackModel.query(knexRead).where({ redeemCode }).first()
    userInvariant(pack && pack.ownerId === null, 'pack not found', 404)

    const template = await this.cms.findPackByTemplateId(
      pack.templateId,
      locale
    )

    invariant(template, 'pack template not in cms')
    invariant(template.type === PackType.Redeem, 'pack not redeemable in cms')

    return {
      ...template,
      id: pack.id,
    }
  }

  async randomPackByTemplateId(
    templateId: string,
    knexRead?: Knex
  ): Promise<PackWithId> {
    const template = await this.cms.findPackByTemplateId(templateId)

    userInvariant(template, 'pack template not found', 404)

    invariant(
      template.type !== PackType.Redeem,
      'cannot pick a random redeemable pack'
    )

    invariant(
      template.type !== PackType.Purchase || template.price !== null,
      'pack does not have a price set'
    )

    // Auctions will only have a single pack, so no randomness needed
    // TODO: support auctions
    // if (packTemplate.type === PackType.Auction) {
    //   const pack = await firstPackByTemplateId(packTemplate)
    //   return {
    //     packId: pack.packId,
    //     type: PackType.Auction,
    //     price: pack.activeBid?.amount || '0',
    //   }
    // }

    // Randomly pick order direction
    const orderDirection = Math.random() < 0.5 ? 'asc' : 'desc'

    const packs = await PackModel.query(knexRead)
      .where({
        templateId,
        ownerId: null,
        claimedAt: null,
        redeemCode: null,
      })
      // Ordering by ID will provide some randomness too since we use UUIDs
      .orderBy('id', orderDirection)
      // Avoid loading all packs
      .limit(20)
      .withGraphFetched('collectibles')

    userInvariant(packs.length > 0, 'no more packs available')

    // Pick a random pack
    const pack = packs[randomInteger(0, packs.length - 1)]

    const packDetails = {
      ...template,
      id: pack.id,
    }
    pack.activeBidId &&
      Object.assign(packDetails, { activeBidId: pack.activeBidId })
    return packDetails
  }

  async getPackMintingStatus(
    request: MintPack,
    knexRead?: Knex
  ): Promise<MintPackStatus> {
    const user = await UserAccountModel.query(knexRead)
      .where('externalId', request.externalId)
      .first()
      .select('id')

    userInvariant(user, 'user not found', 404)

    const pack = await PackModel.query(knexRead)
      .where('id', request.packId)
      .where('ownerId', user.id)
      .select('id')
      .withGraphFetched('collectibles')
      .first()

    userInvariant(pack, 'pack not found', 404)

    return pack.collectibles &&
      pack.collectibles?.every((c) => typeof c.address === 'number')
      ? MintPackStatus.Minted
      : MintPackStatus.Pending
  }

  async transferPackStatus(
    packId: string,
    knexRead?: Knex
  ): Promise<TransferPackStatusList> {
    const pack: PackModel | undefined = await PackModel.query(knexRead)
      .findOne('Pack.id', packId)
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

  async transferPack(
    request: TransferPack,
    trx?: Transaction,
    knexRead?: Knex
  ) {
    const user = await UserAccountModel.query(knexRead)
      .findOne('externalId', request.externalId)
      .withGraphJoined('algorandAccount.creationTransaction')

    userInvariant(user, 'user not found', 404)

    const pack = await PackModel.query(knexRead)
      .where('id', request.packId)
      .where('ownerId', user.id)
      .select('id')
      .withGraphFetched('collectibles')
      .modifyGraph('collectibles', (builder) => {
        builder.select('id')
      })
      .first()

    userInvariant(pack, 'pack not found', 404)

    if (!pack) {
      return false
    }

    this.logger.info({ pack }, 'pack to be transferred')

    if (user.algorandAccount?.creationTransactionId === null) {
      await this.accounts.initializeAccount(
        user.id,
        request.passphrase,
        trx,
        knexRead
      )
    }

    const collectibleIds = pack.collectibles?.map((c) => c.id) || []

    await Promise.all(
      collectibleIds.map(async (id) => {
        await this.collectibles.transferToUserFromCreator(
          id,
          user.id,
          request.passphrase,
          trx,
          knexRead
        )
      })
    )

    // Create transfer success notification to be sent to user
    const packWithBase = await this.getPackById(request.packId, knexRead)
    if (packWithBase) {
      await this.notifications.createNotification(
        {
          type: NotificationType.TransferSuccess,
          userAccountId: user.id,
          variables: {
            packTitle: packWithBase.title,
          },
        },
        trx
      )
    }

    return true
  }

  async untransferredPacks(
    { externalId, locale = DEFAULT_LOCALE }: LocaleAndExternalId,
    knexRead?: Knex
  ) {
    const packs = await PackModel.query(knexRead)
      .alias('p')
      .join('UserAccount as ua', 'ua.id', 'p.ownerId')
      .join('Collectible as c', 'c.packId', 'p.id')
      .whereRaw('"ua"."externalId" = ?', [externalId])
      .whereNotNull('c.address')
      .whereNotExists(
        CollectibleOwnershipModel.query(knexRead)
          .alias('co')
          .select('id')
          .where('co.collectibleId', '=', raw('"c"."id"'))
          .where('co.ownerId', '=', raw('"ua"."id"'))
      )

    if (packs.length === 0) {
      return {
        packs: [],
        total: 0,
      }
    }

    const templateIds = [...new Set(packs.map((p) => p.templateId))]

    const filter: ItemFilter = {
      status: {
        _eq: DirectusStatus.Published,
      },
    }
    if (templateIds.length > 0) filter.id = { _in: templateIds }

    const { packs: templates } = await this.cms.findAllPacks({
      locale,
      pageSize: -1,
      filter,
    })
    const templateLookup = new Map(templates.map((t) => [t.templateId, t]))

    const allPacks: PackByOwner[] = []
    for (const { id, claimedAt, templateId } of packs) {
      const template = templateLookup.get(templateId)
      if (template && claimedAt) {
        allPacks.push({
          ...template,
          id,
          status: template.status,
          claimedAt,
          activeBid: undefined,
        })
      }
    }

    return {
      packs: allPacks,
      total: allPacks.length,
    }
  }

  async claimRandomFreePack(
    request: ClaimFreePack,
    trx?: Transaction,
    knexRead?: Knex
  ) {
    const pack = await this.randomPackByTemplateId(request.templateId, knexRead)
    userInvariant(pack, 'pack not found', 404)
    userInvariant(pack.type === PackType.Free, 'pack is not free')

    const user = await UserAccountModel.query(knexRead).findOne({
      externalId: request.externalId,
    })

    userInvariant(user, 'user not found', 404)

    await PackModel.query(trx)
      .patch({
        claimedAt: new Date().toISOString(),
        ownerId: user.id,
      })
      .where({ id: pack.id })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityId: pack.id,
      entityType: EventEntityType.Pack,
      userAccountId: user.id,
    })

    return pack
  }

  async claimRedeemPack(
    request: ClaimRedeemPack,
    trx?: Transaction,
    knexRead?: Knex,
    locale = DEFAULT_LOCALE
  ) {
    const pack = await this.getPackByRedeemCode(request.redeemCode, knexRead)
    userInvariant(pack, 'pack not found', 404)
    userInvariant(pack.type === PackType.Redeem, 'pack is not redeemable')

    const user = await UserAccountModel.query(knexRead).findOne({
      externalId: request.externalId,
    })

    userInvariant(user, 'user not found', 404)

    await PackModel.query(trx)
      .patch({
        claimedAt: new Date().toISOString(),
        ownerId: user.id,
      })
      .where({ id: pack.id })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityId: pack.id,
      entityType: EventEntityType.Pack,
      userAccountId: user.id,
    })

    return pack
  }

  async claimPack(request: ClaimPack, trx?: Transaction) {
    const pack = await PackModel.query(trx)
      .patch({
        ownerId: request.claimedById ?? null,
        claimedAt: request.claimedAt ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where({ id: request.packId })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityId: request.packId,
      entityType: EventEntityType.Pack,
      userAccountId: request.claimedById,
    })

    return pack
  }

  async revokePack(request: RevokePack, trx?: Transaction, knexRead?: Knex) {
    invariant(
      request.fromAddress || request.ownerId,
      'Pack owner ID or address is required.'
    )
    let userId

    if (request.ownerId) {
      const user = await UserAccountModel.query(knexRead).findById(
        request.ownerId
      )
      userInvariant(user, 'user not found', 404)
      userId = user.id
    }

    const packQuery = PackModel.query(knexRead).where('id', request.packId)

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
            userId,
            trx,
            knexRead
          ))
      )
    )

    // Create transfer success notification to be sent to user
    const packWithBase = await this.getPackById(request.packId, knexRead)
    if (packWithBase) {
      // @TODO: create notification for revoking the pack
    }

    // Remove claim from pack
    await PackModel.query(trx)
      .patch({
        ownerId: null,
        claimedAt: null,
        updatedAt: new Date().toISOString(),
      })
      .where({ id: request.packId })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityId: request.packId,
      entityType: EventEntityType.Pack,
      userAccountId: request.ownerId,
    })

    return pack
  }

  async generatePacks(trx?: Transaction, knexRead?: Knex) {
    const packTemplates = await this.cms.findPacksPendingGeneration(
      undefined,
      knexRead
    )

    let total = 0

    for (const template of packTemplates) {
      total += await this.generatePack(template, trx)
    }

    return total
  }

  private async generatePack(template, trx?: Transaction, knexRead?: Knex) {
    const { collectibleTemplateIds, templateId, config } = template
    const collectibleTemplateIdsCount = collectibleTemplateIds.length
    const collectibleTemplates = await this.cms.findCollectiblesByTemplateIds(
      collectibleTemplateIds,
      undefined,
      knexRead
    )

    const totalCollectibles = collectibleTemplates.reduce(
      (sum, t) => sum + t.totalEditions,
      0
    )

    const unassignedCollectibles = await CollectibleModel.query(knexRead)
      .whereIn('templateId', collectibleTemplateIds)
      .whereNull('packId')
      .where('ipfsStatus', IPFSStatus.Stored)

    if (unassignedCollectibles.length !== totalCollectibles) {
      this.logger.warn(
        'still generating collectibles for pack template %s',
        templateId
      )

      return 0
    }

    const groupedCollectibles = {} as { [key: string]: CollectibleModel[] }

    for (const collectible of unassignedCollectibles) {
      if (groupedCollectibles[collectible.templateId]) {
        groupedCollectibles[collectible.templateId].push(collectible)
      } else {
        groupedCollectibles[collectible.templateId] = [collectible]
      }
    }

    // We shuffle the lists of collectibles to avoid bias towards any rarity
    const listsOfCollectibles = shuffleArray(Object.values(groupedCollectibles))

    for (const collectibles of listsOfCollectibles) {
      if (config.collectibleOrder === PackCollectibleOrder.Random) {
        // We'll need to randomize the collectibles order
        shuffleArray(collectibles)
      } else {
        // Sort by edition number to roughly align the editions for each collectible type
        collectibles.sort((a, b) => {
          if (a.edition && b.edition) {
            return a.edition - b.edition
          }

          return 0
        })
      }
    }

    // If NFTs Per Pack is null, use the number of NFT Templates. And fallback to 1.
    // This is to avoid an out-of-memory error (x / null == Infinity)
    const collectiblesPerPack =
      config.collectiblesPerPack || collectibleTemplateIdsCount || 1

    const maxPacks = // Create a maximum of 1 pack for auction templates
      template.type === 'auction'
        ? 1
        : Math.floor(unassignedCollectibles.length / collectiblesPerPack)

    const packsToCreate: Array<{
      templateId: string
      redeemCode: string | null
      collectibles: Array<{ id: string; templateId: string }>
    }> = []

    for (const collectibles of listsOfCollectibles) {
      for (let index = 0; index < maxPacks; index += 1) {
        // Create or grab the current pack
        const pack = (packsToCreate[index] = packsToCreate[index] || {
          templateId,
          collectibles: [],
          redeemCode:
            template.type === 'redeem' ? randomRedemptionCode() : null,
        })

        const usedCollectibleTemplateIds = pack.collectibles.map(
          (c) => c.templateId
        )
        const nextCollectible = collectibles[0]

        if (
          // 1. No more collectibles of this type
          !nextCollectible ||
          // 2. Already filled this pack
          pack.collectibles.length === collectiblesPerPack ||
          // 3. Already used this collectible type
          usedCollectibleTemplateIds.includes(nextCollectible.templateId)
        ) {
          continue
        }

        // Assign collectible to this pack
        pack.collectibles.push({
          id: nextCollectible.id,
          templateId: nextCollectible.templateId,
        })

        // Remove collectible from unassigned collectibles
        collectibles.splice(0, 1)
      }
    }

    const balancedPacks = packsToCreate.filter(
      (p) => p.collectibles.length === collectiblesPerPack
    )

    if (balancedPacks.length !== maxPacks) {
      // Extra check to ensure we generate all of the expected packs
      this.logger.warn(
        'expected %d balanced packs, got %d for pack template %s',
        maxPacks,
        balancedPacks.length,
        templateId
      )
      return 0
    }

    await PackModel.query(trx).upsertGraph(
      balancedPacks.map((p) => ({
        templateId: p.templateId,
        redeemCode: p.redeemCode,
        collectibles: p.collectibles.map((c) => ({
          id: c.id,
        })),
      })),
      { relate: true }
    )

    // Find newly created packs
    const packs = await PackModel.query()
      .where('templateId', templateId)
      .select('id')

    // Create events for pack creation
    await EventModel.query().insert(
      packs.map((p) => ({
        action: EventAction.Create,
        entityType: EventEntityType.Pack,
        entityId: p.id,
      }))
    )

    return packs.length
  }

  async handlePackAuctionCompletion(trx?: Transaction, knexRead?: Knex) {
    const past7Days = new Date(new Date().setDate(new Date().getDate() - 7))
    // Get pack templates recently completed auctions
    const packTemplates = await this.cms.findAllPacksAuctionCompletion(
      past7Days,
      undefined,
      knexRead
    )

    // Find their associated packs that haven't been handled yet
    const packs = await PackModel.query(knexRead)
      .whereNull('expiresAt')
      .whereNull('ownerId')
      .whereNotNull('activeBidId')
      .whereIn(
        'templateId',
        packTemplates.map(({ templateId }) => templateId)
      )
      .withGraphFetched('activeBid.userAccount')
      .limit(10)

    let numberCompletedPackAuctions = 0
    await Promise.all(
      packs.map(async (pack) => {
        // Verify user account and get the template in their language
        invariant(
          pack.activeBid?.userAccount,
          'activeBid has no associated user'
        )

        const packTemplate = await this.cms.findPackByTemplateId(
          pack.templateId,
          pack.activeBid.userAccount.locale,
          knexRead
        )
        invariant(packTemplate, 'packTemplate not found')

        // Send them a notification for the completed auction
        await this.notifications.createNotification(
          {
            type: NotificationType.AuctionComplete,
            userAccountId: pack.activeBid.userAccount.id,
            variables: {
              amount: `${formatIntToFloat(
                pack.activeBid.amount,
                this.currency
              )}`,
              canExpire: packTemplate.allowBidExpiration,
              packSlug: packTemplate.slug,
              packTitle: packTemplate.title,
            },
          },
          trx
        )

        // Update packs 72 hours in advance
        const newDate72HoursInFuture = new Date(
          new Date().setDate(new Date().getDate() + 3)
        )

        await PackModel.query(trx).where({ id: pack.id }).patch({
          expiresAt: newDate72HoursInFuture.toISOString(),
        })

        await EventModel.query(trx).insert({
          action: EventAction.Update,
          entityId: pack.id,
          entityType: EventEntityType.Pack,
          userAccountId: pack.activeBid.userAccount.id,
        })

        numberCompletedPackAuctions++
      })
    )
    return numberCompletedPackAuctions
  }

  async handlePackAuctionExpiration(trx?: Transaction, knexRead?: Knex) {
    // get 10 packs with an activeBidId and an expires at of lte now
    const packs: PackModel[] = await PackModel.query(knexRead)
      .where('expiresAt', '<=', new Date())
      .whereNull('ownerId')
      .whereNotNull('activeBidId')
      .withGraphFetched('activeBid.userAccount')
      .withGraphFetched('bids.userAccount')
      .limit(10)

    let numberExpiredPackAuctions = 0
    await Promise.all(
      packs.map(async (pack) => {
        // Verify user account and get the template in their language
        invariant(
          pack.activeBid?.userAccount,
          'activeBid has no associated user'
        )

        const packTemplate = await this.cms.findPackByTemplateId(
          pack.templateId,
          pack.activeBid.userAccount.locale,
          knexRead
        )
        invariant(packTemplate, 'packTemplate not found')

        // Send bid expiration notice to the previous high bidder
        await this.notifications.createNotification(
          {
            type: NotificationType.BidExpired,
            userAccountId: pack.activeBid.userAccount.id,
            variables: {
              packTitle: packTemplate.title,
            },
          },
          trx
        )

        if (!pack.bids) {
          numberExpiredPackAuctions++
          return
        }

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

        // If no subsequent bids exist, remove auction data to disable pack auction,
        // otherwise, assign next highest bidder as active bidder
        if (subsequentBids.length === 0) {
          await PackModel.query(trx).where({ id: pack.id }).patch({
            activeBidId: null,
            expiresAt: null,
          })

          await EventModel.query(trx).insert({
            action: EventAction.Update,
            entityId: pack.id,
            entityType: EventEntityType.Pack,
          })

          numberExpiredPackAuctions++
        } else {
          // Find the next highest bid
          const selectedBid = subsequentBids.sort(
            (a, b) => Number(b.amount) - Number(a.amount)
          )[0]

          invariant(
            selectedBid.userAccount,
            'next highest bid has no associated user account'
          )

          const packTemplate = await this.cms.findPackByTemplateId(
            pack.templateId,
            selectedBid.userAccount.locale,
            knexRead
          )
          invariant(packTemplate, 'packTemplate not found')

          // Send notification to next highest bidder
          await this.notifications.createNotification(
            {
              type: NotificationType.AuctionComplete,
              userAccountId: selectedBid.userAccount.id,
              variables: {
                amount: `${formatIntToFloat(
                  selectedBid.amount,
                  this.currency
                )}`,
                canExpire: packTemplate.allowBidExpiration,
                packSlug: packTemplate.slug,
                packTitle: packTemplate.title,
              },
            },
            trx
          )

          // Update pack with next highest bidder and new expiresAt date
          const newDate72HoursInFuture = new Date(
            new Date().setDate(new Date().getDate() + 3)
          )

          await PackModel.query(trx).where({ id: pack.id }).patch({
            activeBidId: selectedBid.id,
            expiresAt: newDate72HoursInFuture.toISOString(),
          })

          await EventModel.query(trx).insert({
            action: EventAction.Update,
            entityId: pack.id,
            entityType: EventEntityType.Pack,
            userAccountId: selectedBid.userAccount.id,
          })

          numberExpiredPackAuctions++
        }
      })
    )
    return numberExpiredPackAuctions
  }
}
