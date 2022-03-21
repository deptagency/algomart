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
  DirectusFaqTemplate,
  DirectusFile,
  DirectusHomepage,
  DirectusLanguageTemplate,
  DirectusPackTemplate,
  DirectusPackTemplateTranslation,
  DirectusPage,
  DirectusPageTranslation,
  DirectusRarity,
  DirectusRarityTranslation,
  DirectusSet,
  DirectusSetTranslation,
  DirectusTeamsTemplate,
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
  invariant,
  isAfterNow,
  isNowBetweenDates,
  isStringArray,
} from '@algomart/shared/utils'
import {
  CMSCacheApplicationModel,
  CMSCacheCollectibleTemplateModel,
  CMSCacheCollectionModel,
  CMSCacheFaqModel,
  CMSCacheHomepageModel,
  CMSCacheLanguageModel,
  CMSCachePackTemplateModel,
  CMSCachePageModel,
  CMSCacheSetModel,
  CMSCacheTeamsModel,
} from '@api/models'
import { URL } from 'node:url'
import Objection, { Transaction } from 'objection'
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
}

export type ItemFilter = {
  [key in ItemFilterType]?:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | boolean[]
    | Date
    | Date[]
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

export default class CMSCacheAdapter {
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

  async findAllTeams() {
    const data = await CMSCacheTeamsModel.query().select('content')
    return (data[0].content as unknown as DirectusTeamsTemplate).team
  }

  async findAllPacksAuctionCompletion(
    startDate,
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
    templateIds,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .whereIn('templateId', templateIds)
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.getFileURL.bind(this), language)
      }
    )

    return data
  }

  async findPacksByType(
    type,
    limit,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .whereIn('type', type)
      .limit(limit)
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.getFileURL.bind(this), language)
      }
    )

    return data
  }

  async findPackBySlug(slug, language = DEFAULT_LANG, trx?: Transaction) {
    const queryResult = await CMSCachePackTemplateModel.query(trx)
      .findOne('slug', slug)
      .select('content')

    const packTemplate = queryResult.content as unknown as DirectusPackTemplate
    return toPackBase(packTemplate, this.getFileURL.bind(this), language)
  }

  async findPackByTemplateId(
    templateId,
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
    templateIds,
    language = DEFAULT_LANG,
    trx?: Transaction
  ) {
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

  async getPage(slug, language = DEFAULT_LANG, trx?: Transaction) {
    const result = await CMSCachePageModel.query(trx).findOne('slug', slug)

    if (result) {
      const page: DirectusPage = result.content as unknown as DirectusPage

      const pageTranslations = getDirectusTranslation<DirectusPageTranslation>(
        page.translations as DirectusPageTranslation[],
        `No translations found for slug "${slug}"`,
        language
      )
      return {
        heroBanner: this.getFileURL(page.hero_banner),
        heroBannerTitle: pageTranslations.hero_banner_title,
        heroBannerSubtitle: pageTranslations.hero_banner_subtitle,
        ...page,
        ...pageTranslations,
      }
    }

    return null
  }

  async getFaqs(language: string = DEFAULT_LANG, trx?: Transaction) {
    const queryResult = await CMSCacheFaqModel.query(trx).select('content')
    const data = queryResult.map(
      (result: CMSCacheFaqModel): DirectusFaqTemplate =>
        result.content as unknown as DirectusFaqTemplate
    )

    return data.map((d) =>
      getDirectusTranslation(
        d.translations,
        `faq has no translations`,
        language
      )
    )
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
        label: directusLanguageTemplate.label,
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

    const queryResult = await this.cacheQueryBuilder(query, queryBuild)
    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): DirectusPackTemplate =>
        result.content as unknown as DirectusPackTemplate
    )
    const result: ItemsResponse<DirectusPackTemplate> = {
      data: data,
      meta: {
        filter_count: queryResult.length,
      },
    }

    if (query.totalCount) {
      const total = await CMSCachePackTemplateModel.query(trx)
        .orWhere('releasedAt', null)
        .orWhere('releasedAt', '<', new Date())
        .count('*', { as: 'count' })
        .first()
        .castTo<{ count: string }>()

      result.meta.total_count = Number.parseInt(total.count, 10)
    }

    return result
  }

  private async findCollectibleTemplates(
    query: ItemQuery = {},
    trx?: Transaction
  ) {
    const queryBuild = CMSCacheCollectibleTemplateModel.query(trx)
    const queryResult = await this.cacheQueryBuilder(query, queryBuild).select(
      'content'
    )

    const data = queryResult.map(
      (result: CMSCacheCollectibleTemplateModel): DirectusCollectibleTemplate =>
        result.content as unknown as DirectusCollectibleTemplate
    )

    const result: ItemsResponse<DirectusCollectibleTemplate> = {
      data: data,
      meta: {
        filter_count: data.length,
      },
    }

    if (query.totalCount) {
      const total = await CMSCacheCollectibleTemplateModel.query()
        .count('*', { as: 'count' })
        .first()
        .castTo<{ count: string }>()
      result.meta.total_count = Number.parseInt(total.count, 10)
    }

    return result
  }

  private async findCollections(query: ItemQuery = {}, trx?: Transaction) {
    const queryBuild = CMSCacheCollectionModel.query(trx)
    const queryResult = await this.cacheQueryBuilder(query, queryBuild).select(
      'content'
    )

    const data = queryResult.map(
      (result: CMSCacheCollectionModel): DirectusCollection =>
        result.content as unknown as DirectusCollection
    )

    const result: ItemsResponse<DirectusCollection> = {
      data: data,
      meta: {
        filter_count: data.length,
      },
    }

    if (query.totalCount) {
      const total = await CMSCacheCollectionModel.query(trx)
        .count('*', { as: 'count' })
        .first()
        .castTo<{ count: string }>()
      result.meta.total_count = Number.parseInt(total.count, 10)
    }

    return result
  }

  private async findSets(query: ItemQuery = {}, trx?: Transaction) {
    const queryBuild = CMSCacheSetModel.query(trx)
    const queryResult = await this.cacheQueryBuilder(query, queryBuild).select(
      'content'
    )

    const data = queryResult.map(
      (result: CMSCacheSetModel): DirectusSet =>
        result.content as unknown as DirectusSet
    )
    const result: ItemsResponse<DirectusSet> = {
      data: data,
      meta: {
        filter_count: data.length,
      },
    }

    if (query.totalCount) {
      const total = await CMSCacheSetModel.query()
        .count('*', { as: 'count' })
        .first()
        .castTo<{ count: string }>()
      result.meta.total_count = Number.parseInt(total.count, 10)
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
    // For each column defined in the filter, loop through and convert to query
    if (query.filter) {
      for (const column of Object.keys(query.filter)) {
        const filters = query.filter[column]

        for (const filterKey of Object.keys(filters)) {
          const filter = filters[filterKey]
          switch (filterKey) {
            case '_in':
              queryBuild = queryBuild.whereIn(column, filter)
              break
            case '_eq':
              queryBuild = queryBuild.where(column, filter)
              break
            case '_gt':
              queryBuild = queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '>', filter)
              })
              break
            case '_lt':
              queryBuild = queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '<', filter)
              })
              break
            case '_gte':
              queryBuild = queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '>=', filter)
              })
              break
            case '_lte':
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

    for (const sort of query.sort) {
      queryBuild = queryBuild.orderBy(sort.field, sort.order)
    }

    if (query.page) {
      queryBuild = queryBuild.offset((query.page - 1) * query.limit)
    }

    if (query.limit && query.limit !== -1) {
      queryBuild = queryBuild.limit(query.limit)
    }

    return queryBuild
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
