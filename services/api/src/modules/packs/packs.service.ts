import {
  BidPublic,
  ClaimFreePack,
  ClaimPack,
  ClaimRedeemPack,
  CollectibleWithDetails,
  DEFAULT_LOCALE,
  EventAction,
  EventEntityType,
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
  SortDirection,
  TransferPack,
} from '@algomart/schemas'
import { raw, Transaction } from 'objection'

import CollectiblesService from '../collectibles/collectibles.service'

import DirectusAdapter, {
  DirectusStatus,
  ItemFilter,
} from '@/lib/directus-adapter'
import { BidModel } from '@/models/bid.model'
import { CollectibleModel } from '@/models/collectible.model'
import { EventModel } from '@/models/event.model'
import { PackModel } from '@/models/pack.model'
import { UserAccountModel } from '@/models/user-account.model'
import NotificationsService from '@/modules/notifications/notifications.service'
import { formatIntToFloat } from '@/utils/format-currency'
import { invariant, userInvariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'
import {
  randomInteger,
  randomRedemptionCode,
  shuffleArray,
} from '@/utils/random'

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
  logger = logger.child({ context: this.constructor.name })

  constructor(
    private readonly cms: DirectusAdapter,
    private readonly collectibles: CollectiblesService,
    private readonly notifications: NotificationsService
  ) {}

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
        activeBid:
          (packWithActiveBid?.activeBid?.amount as number) ?? undefined,
      }
    }
  }

  private async getPacksWithActiveBids(templateIds: string[]) {
    return await PackModel.query()
      .whereIn('templateId', templateIds)
      .withGraphFetched('activeBid')
  }

  private async getPackCounts(templateIds: string[]) {
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
  }

  // #endregion

  async getPublishedPacks({
    locale = DEFAULT_LOCALE,
    page = 1,
    pageSize = 10,
    templateIds = [],
    slug,
    type = [],
    status = [],
    priceHigh = Number.POSITIVE_INFINITY,
    priceLow = 0,
    reserveMet,
    sortBy = PackSortField.Title,
    sortDirection = SortDirection.Ascending,
  }: PublishedPacksQuery): Promise<{ packs: PublishedPack[]; total: number }> {
    invariant(page > 0, 'page must be greater than 0')

    const filter: ItemFilter = {
      status: {
        _eq: DirectusStatus.Published,
      },
    }

    if (slug) filter.slug = { _eq: slug }
    if (templateIds.length > 0) filter.id = { _in: templateIds }
    if (type.length > 0) filter.type = { _in: type }

    const { packs: templates } = await this.cms.findAllPacks({
      locale,
      // need to load all packs into memory
      // TODO: optimize when/if this becomes a problem
      pageSize: -1,
      filter,
    })

    const packCounts = await this.getPackCounts(
      templates.map((t) => t.templateId)
    )

    let packsWithActiveBids: PackModel[] = []

    if (type.length === 0 || type.includes(PackType.Auction)) {
      // only load bids when searching for auction packs
      packsWithActiveBids = await this.getPacksWithActiveBids(
        templates
          .filter((t) => t.type === PackType.Auction)
          .map((t) => t.templateId)
      )
    }

    const packLookup = new Map(packCounts.map((p) => [p.templateId, p]))
    const packWithActiveBidsLookup = new Map(
      packsWithActiveBids.map((p) => [p.templateId, p])
    )

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

    const allPublicPacks = templates
      .map((pack) => assemblePack(pack))
      .filter((pack) => filterPack(pack))
      .sort(sortPack)

    return {
      packs: allPublicPacks.slice((page - 1) * pageSize, page * pageSize),
      total: allPublicPacks.length,
    }
  }

  async getPacksByOwner({
    locale = DEFAULT_LOCALE,
    page = 1,
    pageSize = 10,
    templateIds = [],
    slug,
    type = [],
    sortBy = PackSortByOwnerField.ClaimedAt,
    sortDirection = SortDirection.Ascending,
    ownerExternalId,
  }: PacksByOwnerQuery & OwnerExternalId): Promise<PacksByOwner> {
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
    const packsByOwnerId = await PackModel.query().where('ownerId', user.id)
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
          .map((t) => t.templateId)
      )
    }

    const packWithActiveBidsLookup = new Map(
      packsWithActiveBids.map((p) => [p.templateId, p])
    )

    // List packs purchased by owner with template details
    const allPacks: PackByOwner[] = []
    for (const { claimedAt, templateId } of packsByOwnerId) {
      const template = templateLookup.get(templateId)
      if (template && claimedAt) {
        const packWithActiveBid = packWithActiveBidsLookup.get(templateId)
        allPacks.push({
          ...template,
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
    locale = DEFAULT_LOCALE
  ): Promise<PackWithCollectibles> {
    const pack = await PackModel.query()
      .findOne({ id })
      .withGraphFetched('collectibles')

    userInvariant(pack, 'pack not found', 404)
    invariant(pack.collectibles, 'pack collectibles were not fetched')
    invariant(pack.collectibles.length > 0, 'pack has no collectibles')

    const packTemplate = await this.cms.findPack(
      { id: pack.templateId },
      locale
    )
    invariant(packTemplate, 'pack template missing in cms')

    const { collectibles: collectibleTemplates } =
      await this.cms.findAllCollectibles(locale, {
        id: {
          _in: pack.collectibles.map((c) => c.templateId),
        },
      })

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
      ownerExternalId: pack.owner?.externalId ?? undefined,
      packId: pack.id,
    }
  }

  async getPackById(
    id: string,
    locale = DEFAULT_LOCALE,
    trx?: Transaction
  ): Promise<PackWithId | null> {
    const pack = await PackModel.query(trx).where({ id }).first()

    if (!pack) {
      this.logger.info('pack with id %s not found', id)
      return null
    }

    const template = await this.cms.findPack({ id: pack.templateId }, locale)

    if (!template) {
      throw new Error(`pack template with ID ${pack.templateId} not found`)
    }

    return { ...template, id: pack.id }
  }

  async getPackByRedeemCode(
    redeemCode: string,
    locale = DEFAULT_LOCALE
  ): Promise<PackWithId> {
    const pack = await PackModel.query().where({ redeemCode }).first()
    userInvariant(pack && pack.ownerId === null, 'pack not found', 404)

    const template = await this.cms.findPack(
      {
        id: pack.templateId,
      },
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
    trx?: Transaction
  ): Promise<PackWithId> {
    const template = await this.cms.findPack({ id: templateId })

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

    const packs = await PackModel.query(trx)
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

    userInvariant(
      pack.collectibles?.every((c) => c.address !== null),
      'collectibles not yet minted for this pack',
      404
    )

    const packDetails = {
      ...template,
      id: pack.id,
    }
    pack.activeBidId &&
      Object.assign(packDetails, { activeBidId: pack.activeBidId })
    return packDetails
  }

  async transferPack(request: TransferPack, trx?: Transaction) {
    const user = await UserAccountModel.query(trx)
      .where('externalId', request.externalId)
      .first()
      .select('id')

    userInvariant(user, 'user not found', 404)

    const pack = await PackModel.query(trx)
      .where('id', request.packId)
      .where('ownerId', user.id)
      .select('id')
      .withGraphFetched('collectibles')
      .modifyGraph('collectibles', (builder) => {
        builder.select('id')
      })
      .first()

    userInvariant(pack, 'pack not found', 404)

    this.logger.info({ pack }, 'pack to be transferred')

    if (!pack) {
      return false
    }

    const collectibleIds = pack.collectibles?.map((c) => c.id) || []

    await Promise.all(
      collectibleIds.map(async (id) => {
        await this.collectibles.transferToUserFromCreator(
          id,
          user.id,
          request.passphrase,
          trx
        )
      })
    )

    // Create transfer success notification to be sent to user
    const packWithBase = await this.getPackById(request.packId)
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

  async claimRandomFreePack(request: ClaimFreePack, trx?: Transaction) {
    const pack = await this.randomPackByTemplateId(request.templateId, trx)
    userInvariant(pack, 'pack not found', 404)
    userInvariant(pack.type === PackType.Free, 'pack is not free')

    const user = await UserAccountModel.query(trx).findOne({
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
    locale = DEFAULT_LOCALE,
    trx?: Transaction
  ) {
    const pack = await this.getPackByRedeemCode(request.redeemCode, locale)
    userInvariant(pack, 'pack not found', 404)
    userInvariant(pack.type === PackType.Redeem, 'pack is not redeemable')

    const user = await UserAccountModel.query(trx).findOne({
      externalId: request.externalId,
    })

    userInvariant(user, 'user not found', 404)

    const collectibles = await this.collectibles.getCollectiblesByPackId(
      pack.id
    )
    userInvariant(
      collectibles.every((c) => c.address !== null),
      'collectibles not yet minted for this pack',
      404
    )

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

  async generatePacks(trx?: Transaction) {
    const existingTemplates = await PackModel.query(trx)
      .groupBy('templateId')
      .select('templateId')

    const filter: ItemFilter = {}

    if (existingTemplates.length > 0) {
      filter.id = {
        _nin: existingTemplates.map((c) => c.templateId),
      }
    }

    const template = await this.cms.findPack(filter)

    if (!template) {
      return 0
    }

    const { collectibleTemplateIds, templateId, config } = template
    const collectibleTemplateIdsCount = collectibleTemplateIds.length
    const { collectibles: collectibleTemplates } =
      await this.cms.findAllCollectibles(undefined, {
        id: {
          _in: collectibleTemplateIds,
        },
      })

    const totalCollectibles = collectibleTemplates.reduce(
      (sum, t) => sum + t.totalEditions,
      0
    )

    const unassignedCollectibles = await CollectibleModel.query(trx)
      .whereIn('templateId', collectibleTemplateIds)
      .whereNull('packId')

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
    const packs = await PackModel.query(trx)
      .where('templateId', templateId)
      .select('id')

    // Create events for pack creation
    await EventModel.query(trx).insert(
      packs.map((p) => ({
        action: EventAction.Create,
        entityType: EventEntityType.Pack,
        entityId: p.id,
      }))
    )

    return packs.length
  }

  async handlePackAuctionCompletion(trx?: Transaction) {
    const past7Days = new Date(new Date().setDate(new Date().getDate() - 7))
    // Get pack templates recently completed auctions
    const { packs: packTemplates } = await this.cms.findAllPacks({
      pageSize: -1,
      filter: {
        _and: [
          {
            type: PackType.Auction,
          },
          // Shouldn't need every historical auction
          {
            auction_until: {
              _lt: new Date(),
            },
          },
          {
            auction_until: {
              _gt: past7Days,
            },
          },
        ],
      },
    })

    // Find their associated packs that haven't been handled yet
    const packs = await PackModel.query(trx)
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

        const packTemplate = await this.cms.findPack(
          { id: pack.templateId },
          pack.activeBid.userAccount.locale
        )
        invariant(packTemplate, 'packTemplate not found')

        // Send them a notification for the completed auction
        await this.notifications.createNotification(
          {
            type: NotificationType.AuctionComplete,
            userAccountId: pack.activeBid.userAccount.id,
            variables: {
              amount: `${formatIntToFloat(pack.activeBid.amount)}`,
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

  async handlePackAuctionExpiration(trx?: Transaction) {
    // get 10 packs with an activeBidId and an expires at of lte now
    const packs = await PackModel.query(trx)
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

        const packTemplate = await this.cms.findPack(
          { id: pack.templateId },
          pack.activeBid.userAccount.locale
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

          const packTemplate = await this.cms.findPack(
            { id: pack.templateId },
            selectedBid.userAccount.locale
          )
          invariant(packTemplate, 'packTemplate not found')

          // Send notification to next highest bidder
          await this.notifications.createNotification(
            {
              type: NotificationType.AuctionComplete,
              userAccountId: selectedBid.userAccount.id,
              variables: {
                amount: `${formatIntToFloat(selectedBid.amount)}`,
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
