import {
  CollectibleBase,
  CollectionBase,
  CollectionWithSets,
  Country,
  DEFAULT_LANG,
  DirectusApplication,
  DirectusCollectibleTemplate,
  DirectusCollectibleTemplateTranslation,
  DirectusCollection,
  DirectusCollectionTranslation,
  DirectusCountry,
  DirectusCountryTranslation,
  DirectusFile,
  DirectusHomepage,
  DirectusLanguageTemplate,
  DirectusPackTemplate,
  DirectusPackTemplateTranslation,
  DirectusRarity,
  DirectusRarityTranslation,
  DirectusSet,
  DirectusSetTranslation,
  DirectusTranslation,
  HomepageBase,
  PackBase,
  PackStatus,
  PackType,
  SetBase,
  SetWithCollection,
  SortDirection,
} from '@algomart/schemas'
import {
  CMSCacheApplicationModel,
  CMSCacheCollectibleTemplateModel,
  CMSCacheCollectionModel,
  CMSCacheHomepageModel,
  CMSCacheLanguageModel,
  CMSCachePackTemplateModel,
  CMSCacheSetModel,
} from '@algomart/shared/models'
import {
  invariant,
  isAfterNow,
  isNowBetweenDates,
  isStringArray,
} from '@algomart/shared/utils'
import { URL } from 'node:url'
import Objection, { QueryBuilder, Transaction } from 'objection'
import pino from 'pino'

export interface ItemsResponse<T> {
  data: T[]
  meta?: {
    filter_count?: number
    total_count?: number
  }
}

export interface ItemByIdResponse<T> {
  data: T
}

export enum ItemFilterType {
  lte = '_lte',
  gte = '_gte',
  gt = '_gt',
  lt = '_lt',
  eq = '_eq',
  in = '_in',
  nin = '_nin',
}

export type ItemFilter<T extends Objection.Model = Objection.Model> = {
  [key in ItemFilterType]?:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | boolean[]
    | Date
    | Date[]
    | Objection.QueryBuilder<T>
}

export interface ItemFilters {
  [key: string]: ItemFilter
}

export interface ItemSort {
  field: string
  order: SortDirection
}

export interface ItemQuery {
  search?: string
  sort?: ItemSort[]
  filter?: ItemFilters
  limit?: number
  offset?: number
  page?: number
  deep?: ItemFilters
  totalCount?: boolean
}

function getDirectusTranslation<TItem extends DirectusTranslation>(
  translations: TItem[] & DirectusTranslation[],
  invariantLabel: string,
  language = DEFAULT_LANG
): TItem {
  invariant(
    typeof translations != 'number' && translations?.length > 0,
    `no translations found: ${invariantLabel}`
  )

  const translation =
    translations.find(
      (translation) => translation.languages_code === language
    ) || translations[0]
  invariant(
    translation !== undefined && typeof translation !== 'number',
    invariantLabel
  )

  return translation as TItem
}

// #endregion

// #region Mappers

export type GetFileURL = (file: DirectusFile) => string

export function toHomepageBase(
  homepage: DirectusHomepage,
  getFileURL: GetFileURL,
  language = DEFAULT_LANG
): HomepageBase {
  return {
    featuredPackTemplateId:
      typeof homepage.featured_pack === 'string'
        ? homepage.featured_pack
        : homepage.featured_pack?.id,
    upcomingPackTemplateIds: (homepage.upcoming_packs ?? []).map(
      (pack) => toPackBase(pack, getFileURL, language).templateId
    ),
    notableCollectibleTemplateIds: (homepage.notable_collectibles ?? []).map(
      (collectible) =>
        toCollectibleBase(collectible, getFileURL, language).templateId
    ),
  }
}

export function toSetBase(set: DirectusSet, language = DEFAULT_LANG): SetBase {
  const { id, slug, translations, nft_templates } = set

  const { name } = getDirectusTranslation<DirectusSetTranslation>(
    translations as DirectusSetTranslation[],
    `set ${id} has no translations`,
    language
  )

  const collectibleTemplateIds = isStringArray(nft_templates)
    ? nft_templates
    : nft_templates.map((t) => t.id)

  return {
    id,
    slug,
    name,
    collectibleTemplateIds,
  }
}

export function toCollectionBase(
  collection: DirectusCollection,
  getFileURL: GetFileURL,
  language: string
): CollectionBase {
  const {
    id,
    slug,
    translations,
    reward_image,
    nft_templates,
    collection_image,
  } = collection

  const translation = getDirectusTranslation<DirectusCollectionTranslation>(
    translations as DirectusCollectionTranslation[],
    `collection ${id} has no translations`,
    language
  )

  const collectibleTemplateIds = isStringArray(nft_templates)
    ? nft_templates
    : nft_templates.map((t) => t.id)

  const { name, description, metadata, reward_complete, reward_prompt } =
    translation

  return {
    id,
    slug,
    name,
    description: description ?? undefined,
    metadata: metadata ?? undefined,
    collectibleTemplateIds,
    image: getFileURL(collection_image),
    reward:
      reward_complete && reward_prompt && reward_image
        ? {
            complete: reward_complete,
            prompt: reward_prompt,
            image: getFileURL(reward_image),
          }
        : undefined,
  }
}

export function toSetWithCollection(
  set: DirectusSet,
  getFileURL: GetFileURL,
  language = DEFAULT_LANG
): SetWithCollection {
  const base = toSetBase(set, language)

  invariant(typeof set.collection !== 'string', 'collection must be an object')

  return {
    ...base,
    collection: toCollectionBase(set.collection, getFileURL, language),
  }
}

export function toCollectionWithSets(
  collection: DirectusCollection,
  getFileURL: GetFileURL,
  language = DEFAULT_LANG
): CollectionWithSets {
  const base = toCollectionBase(collection, getFileURL, language)

  invariant(!isStringArray(collection.sets), 'sets must be an array of objects')

  return {
    ...base,
    sets: collection.sets.map((set) => toSetBase(set, language)),
  }
}

export function toCollectibleBase(
  template: DirectusCollectibleTemplate,
  getFileURL: GetFileURL,
  language = DEFAULT_LANG
): CollectibleBase {
  const translation =
    getDirectusTranslation<DirectusCollectibleTemplateTranslation>(
      template.translations as DirectusCollectibleTemplateTranslation[],
      `collectible ${template.id} has no translations`,
      language
    )

  const rarity = template.rarity as DirectusRarity

  const rarityTranslation = rarity
    ? getDirectusTranslation<DirectusRarityTranslation>(
        rarity?.translations as DirectusRarityTranslation[],
        'expected rarity to include translations',
        language
      )
    : undefined

  let collectionId =
    typeof template.collection === 'string'
      ? template.collection
      : template.collection?.id

  if (
    collectionId === undefined &&
    template.set &&
    typeof template.set !== 'string'
  ) {
    collectionId =
      typeof template.set.collection === 'string'
        ? template.set.collection
        : template.set.collection?.id
  }

  const setId =
    typeof template.set === 'string' ? template.set : template.set?.id

  return {
    body: translation.body ?? undefined,
    subtitle: translation.subtitle ?? undefined,
    title: translation.title,
    image: getFileURL(template.preview_image),
    previewVideo: template.preview_video
      ? getFileURL(template.preview_video)
      : undefined,
    previewAudio: template.preview_audio
      ? getFileURL(template.preview_audio)
      : undefined,
    assetFile: template.asset_file
      ? getFileURL(template.asset_file)
      : undefined,
    collectionId,
    setId,
    templateId: template.id,
    totalEditions: template.total_editions,
    uniqueCode: template.unique_code,
    rarity: rarity
      ? {
          code: rarity.code,
          color: rarity.color,
          name: rarityTranslation?.name,
        }
      : undefined,
  }
}

export function toStatus(template: DirectusPackTemplate) {
  if (template.type === PackType.Auction) {
    // Disable auction if either date parameter is not provided
    if (!template.released_at || !template.auction_until) {
      return PackStatus.Expired
    }

    const startDate = new Date(template.released_at)
    const endDate = new Date(template.auction_until)
    if (isAfterNow(startDate)) return PackStatus.Upcoming
    if (isNowBetweenDates(startDate, endDate)) return PackStatus.Active
    if (isAfterNow(endDate)) return PackStatus.Expired

    // If we get here, something was misconfigured
    return PackStatus.Expired
  }
  return PackStatus.Active
}

export function toCountryBase(
  country: DirectusCountry,
  language: string
): Country {
  const translation = getDirectusTranslation<DirectusCountryTranslation>(
    country.countries_code.translations as DirectusCountryTranslation[],
    `country ${country.countries_code} has no translations`,
    language
  )
  return {
    code: country.countries_code.code,
    name: translation.title,
  }
}

export function toPackBase(
  template: DirectusPackTemplate,
  getFileURL: GetFileURL,
  language = DEFAULT_LANG
): PackBase {
  const translation = getDirectusTranslation<DirectusPackTemplateTranslation>(
    template.translations as DirectusPackTemplateTranslation[],
    `pack ${template.id} has no translations`,
    language
  )

  return {
    // TODO: Need to load the additional images from Directus to populate
    additionalImages: [],
    allowBidExpiration: template.allow_bid_expiration,
    auctionUntil: template.auction_until ?? undefined,
    body: translation.body ?? undefined,
    collectibleTemplateIds: template.nft_templates.map(
      (nft_template) => nft_template.id
    ),
    collectibleTemplates: template.nft_templates.map((nft_template) =>
      toCollectibleBase(nft_template, getFileURL, language)
    ),
    config: {
      collectibleDistribution: template.nft_distribution,
      collectibleOrder: template.nft_order,
      collectiblesPerPack: template.nfts_per_pack,
    },
    image: getFileURL(template.pack_image),
    onePackPerCustomer: template.one_pack_per_customer,
    nftsPerPack: template.nfts_per_pack,
    price: template.price || 0,
    releasedAt: template.released_at ?? undefined,
    slug: template.slug,
    status: toStatus(template),
    subtitle: translation.subtitle ?? undefined,
    templateId: template.id,
    title: translation.title,
    type: template.type,
  }
}

// #endregion

export interface CMSCacheAdapterOptions {
  cmsUrl: string
  gcpCdnUrl: string
}

export class CMSCacheAdapter {
  logger: pino.Logger<unknown>

  constructor(
    private readonly options: CMSCacheAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async findApplication(trx?: Transaction) {
    const queryResult = await CMSCacheApplicationModel.query(trx)
      .select('content')
      .first()

    const result: DirectusApplication =
      queryResult.content as unknown as DirectusApplication

    return result
  }

  async findAllCountries(language = DEFAULT_LANG, trx?: Transaction) {
    const application = await this.findApplication(trx)

    return application.countries.map((country) => {
      return toCountryBase(country, language)
    })
  }

  async findAllPacksAuctionCompletion(
    startDate: Date,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .where('type', PackType.Auction)
      .where('auctionUntil', '>', startDate)
      .select('content')
      .orderBy('releasedAt', 'desc')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): DirectusPackTemplate =>
        result.content as unknown as DirectusPackTemplate
    )

    return data.map((template) =>
      toPackBase(template, this.getFileURL.bind(this), language)
    )
  }

  async findAllPacks(
    {
      language = DEFAULT_LANG,
      page = 1,
      pageSize = 10,
      filter = {},
      sort = [
        {
          field: 'releasedAt',
          order: SortDirection.Descending,
        },
      ],
    }: {
      language?: string
      page?: number
      pageSize?: number
      filter?: ItemFilters
      sort?: ItemSort[]
    },
    trx?: Transaction
  ) {
    const response = await this.findPackTemplates(
      {
        page,
        limit: pageSize,
        sort,
        filter,
        totalCount: true,
      },
      trx
    )

    invariant(
      typeof response.meta?.total_count === 'number',
      'total_count missing from response'
    )

    return {
      packs: response.data.map((template) =>
        toPackBase(template, this.getFileURL.bind(this), language)
      ),
      total: response.meta.total_count,
    }
  }

  async findPacksByTemplateIds(
    templateIds: string[],
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .whereIn('id', templateIds)
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.getFileURL.bind(this), language)
      }
    )

    return data
  }

  async findPackBySlug(
    slug: string,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .findOne('slug', slug)
      .select('content')

    const packTemplate = queryResult.content as unknown as DirectusPackTemplate
    return toPackBase(packTemplate, this.getFileURL.bind(this), language)
  }

  async findPackByTemplateId(
    templateId: string,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .findOne('id', templateId)
      .select('content')

    const packTemplate = queryResult.content as unknown as DirectusPackTemplate
    return toPackBase(packTemplate, this.getFileURL.bind(this), language)
  }

  async findPacksPendingGeneration(language = DEFAULT_LANG, trx?: Transaction) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .leftJoin('Pack', 'Pack.templateId', 'CmsCachePackTemplates.id')
      .whereNull('Pack.templateId')
      .distinctOn('CmsCachePackTemplates.id')
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.getFileURL.bind(this), language)
      }
    )

    return data
  }

  async findAllCollectibles(
    language = DEFAULT_LANG,
    filter: ItemFilters = {},
    limit = -1,
    trx?: Transaction
  ) {
    const response = await this.findCollectibleTemplates(
      {
        filter,
        limit,
      },
      trx
    )

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collectibles: response.data.map((template) =>
        toCollectibleBase(template, this.getFileURL.bind(this), language)
      ),
      total: response.meta.filter_count,
    }
  }

  async findCollectiblesByTemplateIds(
    templateIds: string[],
    language = DEFAULT_LANG,
    trx?: Transaction
  ): Promise<CollectibleBase[]> {
    const queryResult = await CMSCacheCollectibleTemplateModel.query(trx)
      .whereIn('id', templateIds)
      .select('content')

    const data = queryResult.map(
      (result: CMSCacheCollectibleTemplateModel): CollectibleBase => {
        const collectibleTemplate =
          result.content as unknown as DirectusCollectibleTemplate
        return toCollectibleBase(
          collectibleTemplate,
          this.getFileURL.bind(this),
          language
        )
      }
    )

    return data
  }

  async findCollectibleByTemplateId(
    templateId: string,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const queryResult = await CMSCacheCollectibleTemplateModel.query(trx)
      .findOne('id', templateId)
      .select('content')

    const collectibleTemplate =
      queryResult.content as unknown as DirectusCollectibleTemplate
    return toCollectibleBase(
      collectibleTemplate,
      this.getFileURL.bind(this),
      language
    )
  }

  async findAllCollections(language = DEFAULT_LANG, trx?: Transaction) {
    const response = await this.findCollections(undefined, trx)

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collections: response.data.map((c) =>
        toCollectionWithSets(c, this.getFileURL.bind(this), language)
      ),
      total: response.meta.filter_count,
    }
  }

  async findCollectionBySlug(
    slug: string,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const result = await CMSCacheCollectionModel.query(trx).findOne(
      'slug',
      slug
    )

    if (result) {
      const collection: DirectusCollection =
        result.content as unknown as DirectusCollection
      return toCollectionWithSets(
        collection,
        this.getFileURL.bind(this),
        language
      )
    }

    return null
  }

  async findSetBySlug(
    slug: string,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const result = await CMSCacheSetModel.query(trx).findOne('slug', slug)

    if (result) {
      const set: DirectusSet = result.content as unknown as DirectusSet
      return toSetWithCollection(set, this.getFileURL.bind(this), language)
    }

    return null
  }

  async findHomepage(language: string = DEFAULT_LANG, trx?: Transaction) {
    const queryResult = await CMSCacheHomepageModel.query(trx)
      .select('content')
      .first()
    const result: DirectusHomepage =
      queryResult.content as unknown as DirectusHomepage

    return toHomepageBase(result, this.getFileURL.bind(this), language)
  }

  async getLanguages(trx?: Transaction) {
    const queryResult = await CMSCacheLanguageModel.query(trx)

    return queryResult
      .map((directusLanguageTemplate: DirectusLanguageTemplate) => ({
        languages_code: directusLanguageTemplate.code,
        label: directusLanguageTemplate.name,
        sort: directusLanguageTemplate.sort,
      }))
      .sort(({ sort: a }, { sort: b }) => {
        if (a < b) {
          return -1
        }
        if (a > b) {
          return 1
        }

        return 0
      })
  }

  private async findPackTemplates(query: ItemQuery = {}, trx?: Transaction) {
    const queryBuild = CMSCachePackTemplateModel.query(trx)
      .orWhere('releasedAt', null)
      .orWhere('releasedAt', '<', new Date())

    const { total, results } = await this.cacheQueryBuilder(query, queryBuild)
    const data = results.map(
      (result: CMSCachePackTemplateModel): DirectusPackTemplate =>
        result.content as unknown as DirectusPackTemplate
    )
    const result: ItemsResponse<DirectusPackTemplate> = {
      data,
      meta: {
        filter_count: data.length,
        total_count: total,
      },
    }

    return result
  }

  private async findCollectibleTemplates(
    query: ItemQuery = {},
    trx?: Transaction
  ) {
    const queryBuild = CMSCacheCollectibleTemplateModel.query(trx)
    const { total, results } = await this.cacheQueryBuilder(query, queryBuild)

    const data = results.map(
      (result: CMSCacheCollectibleTemplateModel): DirectusCollectibleTemplate =>
        result.content as unknown as DirectusCollectibleTemplate
    )

    const result: ItemsResponse<DirectusCollectibleTemplate> = {
      data,
      meta: {
        filter_count: data.length,
        total_count: total,
      },
    }

    return result
  }

  private async findCollections(query: ItemQuery = {}, trx?: Transaction) {
    const queryBuild = CMSCacheCollectionModel.query(trx)
    const { total, results } = await this.cacheQueryBuilder(query, queryBuild)

    const data = results.map(
      (result: CMSCacheCollectionModel): DirectusCollection =>
        result.content as unknown as DirectusCollection
    )

    const result: ItemsResponse<DirectusCollection> = {
      data,
      meta: {
        filter_count: data.length,
        total_count: total,
      },
    }

    return result
  }

  private cacheQueryBuilder(
    query: ItemQuery,
    queryBuild: Objection.QueryBuilder<
      | CMSCachePackTemplateModel
      | CMSCacheCollectibleTemplateModel
      | CMSCacheCollectionModel
      | CMSCacheSetModel,
      | CMSCachePackTemplateModel[]
      | CMSCacheCollectibleTemplateModel[]
      | CMSCacheCollectionModel[]
      | CMSCacheSetModel[]
    >
  ) {
    queryBuild = queryBuild.select('content')

    // For each column defined in the filter, loop through and convert to query
    if (query.filter) {
      for (const column of Object.keys(query.filter)) {
        const filters = query.filter[column]

        for (const filterKey of Object.keys(filters)) {
          const filter = filters[filterKey]
          switch (filterKey) {
            case ItemFilterType.in:
              queryBuild =
                column !== 'status'
                  ? queryBuild.whereIn(column, filter)
                  : queryBuild.where((builder) => {
                      this.inStatusFilter(builder, filter)
                    })
              break
            case ItemFilterType.nin:
              queryBuild = queryBuild.whereNotIn(column, filter)
              break
            case ItemFilterType.eq:
              queryBuild = queryBuild.where(column, filter)
              break
            case ItemFilterType.gt:
              queryBuild =
                column !== 'reserveMet'
                  ? queryBuild.where((builder) => {
                      builder.orWhere(column, null).orWhere(column, '>', filter)
                    })
                  : queryBuild.where((builder) =>
                      this.gtReserveMetWhere(builder)
                    )
              break
            case ItemFilterType.lt:
              queryBuild = queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '<', filter)
              })
              break
            case ItemFilterType.gte:
              queryBuild = queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '>=', filter)
              })
              break
            case ItemFilterType.lte:
              queryBuild = queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '<=', filter)
              })
              break
            default:
              break
          }
        }
      }
    }

    for (let i = 0; i < query.sort?.length; i++) {
      const sort = query.sort[i]
      queryBuild = queryBuild.orderBy(sort.field, sort.order)
    }

    const page = query.page - 1 || 0
    const pageSize =
      query.limit != -1 ? query.limit || 10 : Number.MAX_SAFE_INTEGER

    return queryBuild.page(page, pageSize)
  }

  private inStatusFilter<M extends Objection.Model>(
    queryBuild: QueryBuilder<M>,
    statuses: PackStatus[]
  ) {
    return queryBuild.where((builder) => {
      builder
        .orWhereIn('type', [PackType.Free, PackType.Purchase, PackType.Redeem])
        .orWhere((subBuilder) =>
          this.auctionUpcomingWhere(subBuilder, statuses)
        )
        .orWhere((subBuilder) => this.auctionActiveWhere(subBuilder, statuses))
        .orWhere((subBuilder) => this.auctionExpiredWhere(subBuilder, statuses))
    })
  }

  private auctionUpcomingWhere<M extends Objection.Model>(
    builder: QueryBuilder<M>,
    statuses: PackStatus[]
  ) {
    return statuses.includes(PackStatus.Upcoming)
      ? builder.where('releasedAt', '>', new Date())
      : builder
  }

  private auctionActiveWhere<M extends Objection.Model>(
    builder: QueryBuilder<M>,
    statuses: PackStatus[]
  ) {
    return statuses.includes(PackStatus.Active)
      ? builder
          .where('releasedAt', '<', new Date())
          .where('auctionUntil', '>', new Date())
      : builder
  }

  private auctionExpiredWhere<M extends Objection.Model>(
    builder: QueryBuilder<M>,
    statuses: PackStatus[]
  ) {
    return statuses.includes(PackStatus.Expired)
      ? builder.where('auctionUntil', '<', new Date())
      : builder
  }

  private gtReserveMetWhere<M extends Objection.Model>(
    builder: QueryBuilder<M>
  ) {
    return builder
      .orWhereIn('type', [PackType.Free, PackType.Purchase, PackType.Redeem])
      .orWhere((subBuilder) => {
        subBuilder
          .where('type', PackType.Auction)
          .withGraphFetched('pack.activeBid')
          .where('activeBid' > 'price')
      })
  }

  private getFileURL(file: DirectusFile | null) {
    if (file === null) {
      return null
    }

    if (file.storage == 'gcp' && this.options.gcpCdnUrl !== undefined) {
      return new URL(`${this.options.gcpCdnUrl}/${file.filename_disk}`).href
    }

    return new URL(`/assets/${file.id}`, this.options.cmsUrl).href
  }
}
