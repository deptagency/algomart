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
  DirectusFaqTemplateTranslation,
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
  DirectusStatus,
  DirectusTag,
  DirectusTagTranslation,
  DirectusTranslation,
  DirectusWebhook,
  Faq,
  HomepageBase,
  PackBase,
  PackStatus,
  PackType,
  RarityBase,
  SetBase,
  SetWithCollection,
  SortDirection,
  TagBase,
} from '@algomart/schemas'
import { DirectusAdapter } from '@algomart/shared/adapters'
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
  CMSCacheTagModel,
} from '@algomart/shared/models'
import {
  invariant,
  isAfterNow,
  isNowBetweenDates,
  isStringArray,
} from '@algomart/shared/utils'
import { URL } from 'node:url'
import Objection, { QueryBuilder } from 'objection'
import pino from 'pino'

import { GeneratorService } from './generator.service'

//#region util types

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
    | QueryBuilder<T>
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

export type GetFileURL = (
  file: DirectusFile,
  options: CMSCacheServiceOptions
) => string

export function toHomepageBase(
  homepage: DirectusHomepage,
  imageUrlOptions: CMSCacheServiceOptions,
  language = DEFAULT_LANG
): HomepageBase {
  const translation = getDirectusTranslation(
    homepage.translations,
    `homepage has no translations`,
    language
  )

  return {
    heroPackTemplate: homepage.hero_pack
      ? toPackBase(homepage.hero_pack, imageUrlOptions, language)
      : undefined,
    featuredNftsSubtitle: translation.featured_nfts_subtitle,
    featuredNftsTitle: translation.featured_nfts_title,
    featuredNftTemplates: (homepage.featured_nfts ?? []).map((collectible) =>
      toCollectibleBase(collectible, imageUrlOptions, language)
    ),
    featuredPacksSubtitle: translation.featured_packs_subtitle,
    featuredPacksTitle: translation.featured_packs_title,
    featuredPackTemplates: (homepage.featured_packs ?? []).map((collectible) =>
      toPackBase(collectible, imageUrlOptions, language)
    ),
    featuredFaqs: (homepage.featured_faqs ?? []).map((faq) =>
      toFaqBase(faq, language)
    ),
    featuredRarities: (homepage.featured_rarities ?? []).map((rarity) =>
      toRarityBase(rarity, imageUrlOptions, language)
    ),
  }
}

export function toRarityBase(
  rarity: DirectusRarity,
  options: CMSCacheServiceOptions,
  language = DEFAULT_LANG
): RarityBase {
  const { code, color, image, translations } = rarity

  const { name, description } =
    getDirectusTranslation<DirectusRarityTranslation>(
      translations as DirectusRarityTranslation[],
      `Rarity ${code} has no translations`,
      language
    )

  return {
    code,
    color,
    description,
    image: getFileURL(image, options),
    name,
  }
}

export function toFaqBase(
  faq: DirectusFaqTemplate,
  language = DEFAULT_LANG
): Faq {
  const { key, translations } = faq

  const { answer, question } =
    getDirectusTranslation<DirectusFaqTemplateTranslation>(
      translations as DirectusFaqTemplateTranslation[],
      `FAQ ${key} has no translations`,
      language
    )

  return {
    key,
    answer,
    question,
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

export function toTagBase(tag: DirectusTag, language = DEFAULT_LANG): TagBase {
  const { slug, translations } = tag

  const { title } = getDirectusTranslation<DirectusTagTranslation>(
    translations as DirectusTagTranslation[],
    `tag ${slug} has no translations`,
    language
  )

  return {
    slug,
    title,
  }
}

export function toCollectionBase(
  collection: DirectusCollection,
  options: CMSCacheServiceOptions,
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
    image: getFileURL(collection_image, options),
    reward:
      reward_complete && reward_prompt && reward_image
        ? {
            complete: reward_complete,
            prompt: reward_prompt,
            image: getFileURL(reward_image, options),
          }
        : undefined,
  }
}

export function toSetWithCollection(
  set: DirectusSet,
  imageUrlOptions: CMSCacheServiceOptions,
  language = DEFAULT_LANG
): SetWithCollection {
  const base = toSetBase(set, language)

  invariant(typeof set.collection !== 'string', 'collection must be an object')

  return {
    ...base,
    collection: toCollectionBase(set.collection, imageUrlOptions, language),
  }
}

export function toCollectionWithSets(
  collection: DirectusCollection,
  imageUrlOptions: CMSCacheServiceOptions,
  language = DEFAULT_LANG
): CollectionWithSets {
  const base = toCollectionBase(collection, imageUrlOptions, language)

  invariant(!isStringArray(collection.sets), 'sets must be an array of objects')

  return {
    ...base,
    sets: collection.sets.map((set) => toSetBase(set, language)),
  }
}

export function toCollectibleBase(
  template: DirectusCollectibleTemplate,
  imageUrlOptions?: CMSCacheServiceOptions,
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

  const collection = template.collection ?? template.set?.collection

  return {
    body: translation.body ?? undefined,
    subtitle: translation.subtitle ?? undefined,
    title: translation.title,
    image: imageUrlOptions
      ? getFileURL(template.preview_image, imageUrlOptions)
      : undefined,
    previewVideo:
      template.preview_video && imageUrlOptions
        ? getFileURL(template.preview_video, imageUrlOptions)
        : undefined,
    previewAudio:
      template.preview_audio && imageUrlOptions
        ? getFileURL(template.preview_audio, imageUrlOptions)
        : undefined,
    assetFile:
      template.asset_file && imageUrlOptions
        ? getFileURL(template.asset_file, imageUrlOptions)
        : undefined,
    collectionId,
    collection:
      collection && typeof collection !== 'string'
        ? toCollectionBase(collection, imageUrlOptions, language)
        : undefined,
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
    tags: template.tags
      ? template.tags.map((tag) => toTagBase(tag.tags_id, language))
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
    country.countries_id.translations as DirectusCountryTranslation[],
    `country ${country.countries_id} has no translations`,
    language
  )
  return {
    code: country.countries_id.code,
    flagEmoji: country.countries_id.flag_emoji,
    name: translation.title,
  }
}

export function toPackBase(
  template: DirectusPackTemplate,
  imageUrlOptions: CMSCacheServiceOptions,
  language = DEFAULT_LANG,
  includeCollectibles = true
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
    banner:
      imageUrlOptions && template.pack_banner
        ? getFileURL(template.pack_banner, imageUrlOptions)
        : undefined,
    body: translation.body ?? undefined,
    collectibleTemplateIds:
      includeCollectibles && template.show_nfts
        ? template.nft_templates.map((nft_template) => nft_template.id)
        : undefined,
    collectibleTemplates:
      includeCollectibles && template.show_nfts
        ? template.nft_templates.map((nft_template) =>
            toCollectibleBase(nft_template, imageUrlOptions, language)
          )
        : undefined,
    config: {
      collectibleDistribution: template.nft_distribution,
      collectibleOrder: template.nft_order,
      collectiblesPerPack: template.nfts_per_pack,
    },
    image: imageUrlOptions
      ? getFileURL(template.pack_image, imageUrlOptions)
      : undefined,
    onePackPerCustomer: template.one_pack_per_customer,
    nftsPerPack: template.nfts_per_pack,
    price: template.price || 0,
    releasedAt: template.released_at ?? undefined,
    showNfts: template.show_nfts,
    slug: template.slug,
    status: toStatus(template),
    subtitle: translation.subtitle ?? undefined,
    templateId: template.id,
    title: translation.title,
    type: template.type,
    tags: template.tags
      ? template.tags.map((tag) => toTagBase(tag.tags_id, language))
      : undefined,
  }
}

export function getFileURL(
  file: DirectusFile | null,
  options?: CMSCacheServiceOptions
) {
  if (file === null || options === null) {
    return null
  }

  if (file.storage == 'gcp' && options.gcpCdnUrl !== undefined) {
    return new URL(`${options.gcpCdnUrl}/${file.filename_disk}`).href
  }

  return new URL(`/assets/${file.id}`, options.cmsUrl).href
}

// #endregion

export interface CMSCacheServiceOptions {
  cmsUrl: string
  gcpCdnUrl: string
}

export class CMSCacheService {
  logger: pino.Logger<unknown>

  constructor(
    public readonly options: CMSCacheServiceOptions,
    private readonly cms: DirectusAdapter | undefined,
    private readonly generator: GeneratorService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  // #region CMS Cache queries

  async findApplication() {
    const queryResult = await CMSCacheApplicationModel.query()
      .select('content')
      .first()

    const result: DirectusApplication =
      queryResult.content as unknown as DirectusApplication

    return result
  }

  async findAllCountries(language = DEFAULT_LANG) {
    const application = await this.findApplication()

    return application.countries
      .map((country) => {
        return toCountryBase(country, language)
      })
      .sort(({ name: a }, { name: b }) => {
        if (a < b) {
          return -1
        }
        if (a > b) {
          return 1
        }
        return 0
      })
  }

  async findAllPacksAuctionCompletion(
    startDate: Date,
    language = DEFAULT_LANG
  ) {
    const queryResult = await CMSCachePackTemplateModel.query()
      .where('type', PackType.Auction)
      .where('auctionUntil', '>', startDate)
      .select('content')
      .orderBy('releasedAt', 'desc')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): DirectusPackTemplate =>
        result.content as unknown as DirectusPackTemplate
    )

    return data.map((template) => toPackBase(template, this.options, language))
  }

  async findAllPacks({
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
  }) {
    const response = await this.findPackTemplates({
      page,
      limit: pageSize,
      sort,
      filter,
      totalCount: true,
    })

    invariant(
      typeof response.meta?.total_count === 'number',
      'total_count missing from response'
    )

    return {
      packs: response.data.map((template) =>
        toPackBase(template, this.options, language)
      ),
      total: response.meta.total_count,
    }
  }

  async findPacksByTemplateIds(templateIds: string[], language = DEFAULT_LANG) {
    const queryResult = await CMSCachePackTemplateModel.query()
      .whereIn('id', templateIds)
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.options, language)
      }
    )

    return data
  }

  async findPackBySlug(slug: string, language = DEFAULT_LANG) {
    const queryResult = await CMSCachePackTemplateModel.query()
      .findOne('slug', slug)
      .select('content')

    const packTemplate = queryResult.content as unknown as DirectusPackTemplate
    return toPackBase(packTemplate, this.options, language)
  }

  async findPackByTemplateId(templateId: string, language = DEFAULT_LANG) {
    const queryResult = await CMSCachePackTemplateModel.query()
      .findOne('id', templateId)
      .select('content')

    const packTemplate = queryResult.content as unknown as DirectusPackTemplate
    return toPackBase(packTemplate, this.options, language)
  }

  async findAllCollectibles(
    language = DEFAULT_LANG,
    filter: ItemFilters = {},
    limit = -1
  ): Promise<{ collectibles: CollectibleBase[]; total: number }> {
    const response = await this.findCollectibleTemplates({
      filter,
      limit,
    })

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collectibles: response.data.map((template) =>
        toCollectibleBase(template, this.options, language)
      ),
      total: response.meta.filter_count,
    }
  }

  async findCollectiblesByTemplateIds(
    templateIds: string[],
    language = DEFAULT_LANG
  ): Promise<CollectibleBase[]> {
    const queryResult = await CMSCacheCollectibleTemplateModel.query()
      .whereIn('id', templateIds)
      .select('content')

    const data = queryResult.map(
      (result: CMSCacheCollectibleTemplateModel): CollectibleBase => {
        const collectibleTemplate =
          result.content as unknown as DirectusCollectibleTemplate
        return toCollectibleBase(collectibleTemplate, this.options, language)
      }
    )

    return data
  }

  async findCollectibleByTemplateId(
    templateId: string,
    language = DEFAULT_LANG
  ) {
    const queryResult = await CMSCacheCollectibleTemplateModel.query()
      .findOne('id', templateId)
      .select('content')

    const collectibleTemplate =
      queryResult.content as unknown as DirectusCollectibleTemplate
    return toCollectibleBase(collectibleTemplate, this.options, language)
  }

  async findCollectibleByUniqueCode(
    uniqueCode: string,
    language = DEFAULT_LANG
  ) {
    const queryResult = await CMSCacheCollectibleTemplateModel.query()
      .findOne('uniqueCode', uniqueCode)
      .select('content')

    const collectibleTemplate =
      queryResult.content as unknown as DirectusCollectibleTemplate
    return toCollectibleBase(collectibleTemplate, this.options, language)
  }

  async findAllCollections(language = DEFAULT_LANG) {
    const response = await this.findCollections()

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collections: response.data.map((c) =>
        toCollectionWithSets(c, this.options, language)
      ),
      total: response.meta.filter_count,
    }
  }

  async findCollectionBySlug(slug: string, language = DEFAULT_LANG) {
    const result = await CMSCacheCollectionModel.query().findOne('slug', slug)

    if (result) {
      const collection: DirectusCollection =
        result.content as unknown as DirectusCollection
      return toCollectionWithSets(collection, this.options, language)
    }

    return null
  }

  async findSetBySlug(slug: string, language = DEFAULT_LANG) {
    const result = await CMSCacheSetModel.query().findOne('slug', slug)

    if (result) {
      const set: DirectusSet = result.content as unknown as DirectusSet
      return toSetWithCollection(set, this.options, language)
    }

    return null
  }

  async getPage(slug: string, language = DEFAULT_LANG) {
    const result = await CMSCachePageModel.query().findOne('slug', slug)

    if (result) {
      const page: DirectusPage = result.content as unknown as DirectusPage

      const pageTranslations = getDirectusTranslation<DirectusPageTranslation>(
        page.translations as DirectusPageTranslation[],
        `No translations found for slug "${slug}"`,
        language
      )
      return {
        heroBanner: getFileURL(page.hero_banner, this.options),
        heroBannerTitle: pageTranslations.hero_banner_title,
        heroBannerSubtitle: pageTranslations.hero_banner_subtitle,
        ...page,
        ...pageTranslations,
      }
    }

    return null
  }

  async getFaqs(language: string = DEFAULT_LANG) {
    const queryResult = await CMSCacheFaqModel.query().select('content')
    const data = queryResult.map(
      (result: CMSCacheFaqModel): DirectusFaqTemplate =>
        result.content as unknown as DirectusFaqTemplate
    )

    return data
      .map(({ key, translations, sort }) => ({
        key,
        sort,
        ...getDirectusTranslation(
          translations,
          `faq has no translations`,
          language
        ),
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

  async findHomepage(language: string = DEFAULT_LANG) {
    const queryResult = await CMSCacheHomepageModel.query()
      .select('content')
      .first()
    const result: DirectusHomepage =
      queryResult.content as unknown as DirectusHomepage
    return toHomepageBase(result, this.options, language)
  }

  async getLanguages() {
    const queryResult = await CMSCacheLanguageModel.query()

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

  private async findPackTemplates(
    query: ItemQuery = {}
  ): Promise<ItemsResponse<DirectusPackTemplate>> {
    const queryBuild = CMSCachePackTemplateModel.query()
      .orWhere('releasedAt', null)
      .orWhere('releasedAt', '<', new Date())

    const { total, results } = await this.cacheQueryBuilder(query, queryBuild)

    const data = results.map(
      (result: CMSCachePackTemplateModel) => result.content
    )

    return {
      data,
      meta: {
        filter_count: results.length,
        total_count: total,
      },
    }
  }

  private async findCollectibleTemplates(query: ItemQuery = {}) {
    const queryBuild = CMSCacheCollectibleTemplateModel.query()
    const { total, results } = await this.cacheQueryBuilder(query, queryBuild)

    const data = results.map(
      (result: CMSCacheCollectibleTemplateModel): DirectusCollectibleTemplate =>
        result.content as unknown as DirectusCollectibleTemplate
    )

    const result: ItemsResponse<DirectusCollectibleTemplate> = {
      data: data,
      meta: {
        filter_count: data.length,
        total_count: total,
      },
    }

    return result
  }

  private async findCollections(query: ItemQuery = {}) {
    const queryBuild = CMSCacheCollectionModel.query()
    const { total, results } = await this.cacheQueryBuilder(query, queryBuild)

    const data = results.map(
      (result: CMSCacheCollectionModel): DirectusCollection =>
        result.content as unknown as DirectusCollection
    )

    const result: ItemsResponse<DirectusCollection> = {
      data: data,
      meta: {
        filter_count: data.length,
        total_count: total,
      },
    }

    return result
  }

  private cacheQueryBuilder(
    query: ItemQuery,
    queryBuild: QueryBuilder<
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
    queryBuild.select('content')

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
              queryBuild.whereNotIn(column, filter)
              break
            case ItemFilterType.eq:
              queryBuild.where(column, filter)
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
              queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '<', filter)
              })
              break
            case ItemFilterType.gte:
              queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '>=', filter)
              })
              break
            case ItemFilterType.lte:
              queryBuild.where((builder) => {
                builder.orWhere(column, null).orWhere(column, '<=', filter)
              })
              break
            default:
              break
          }
        }
      }
    }

    for (let index = 0; index < query.sort?.length; index++) {
      const sort = query.sort[index]
      queryBuild.orderBy(sort.field, sort.order)
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

  // #endregion

  // #region directus sync methods
  private async syncCollection(collectionId: string, syncRelated = true) {
    const response = await this.cms?.findCollections({
      filter: {
        id: {
          _eq: collectionId,
        },
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    if (response.data.length > 0) {
      const collection = response.data[0] as unknown as DirectusCollection
      await CMSCacheCollectionModel.upsert(collection)

      if (syncRelated) {
        // Sync related Sets
        if (collection.sets) {
          await Promise.all(
            collection.sets.map((set) => this.syncSet(set.id, false))
          )
        }

        // Sync related NFT templates
        if (collection.nft_templates) {
          await Promise.all(
            collection.nft_templates.map((template) =>
              this.syncCollectibleTemplate(template.id)
            )
          )
        }
      }
    }
  }

  private async syncCollectibleTemplate(collectibleId: string) {
    const response = await this.cms?.findCollectibleTemplates({
      filter: {
        id: {
          _eq: collectibleId,
        },
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    if (response.data.length > 0) {
      const template = response.data[0]
      await CMSCacheCollectibleTemplateModel.upsert(
        template as DirectusCollectibleTemplate
      )

      await this.generator.queueUploadCollectibleFilesIfNeeded(template.id)
    }
  }

  private async syncLanguage(languageCode: string) {
    const response = await this.cms?.findLanguages({
      filter: {
        code: {
          _eq: languageCode,
        },
      },
    })

    if (response.data.length > 0) {
      await CMSCacheLanguageModel.upsert(
        response.data[0] as unknown as DirectusLanguageTemplate
      )
    }
  }

  private async syncTag(tagId: string) {
    const response = await this.cms?.findTags({
      filter: {
        id: {
          _eq: tagId,
        },
      },
    })

    if (response.data.length > 0) {
      const updatedTag = response.data[0] as unknown as DirectusTag
      const currentTagInstance = await CMSCacheTagModel.query()
        .where('id', tagId)
        .first()

      if (currentTagInstance) {
        await CMSCacheCollectibleTemplateModel.replaceTag(
          currentTagInstance.slug,
          updatedTag.slug
        )
        await CMSCachePackTemplateModel.replaceTag(
          currentTagInstance.slug,
          updatedTag.slug
        )
      }

      await CMSCacheTagModel.upsert(updatedTag)
    }
  }

  private async syncPackTemplate(packId: string) {
    const response = await this.cms?.findPackTemplates({
      filter: {
        id: {
          _eq: packId,
        },
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    if (response.data.length > 0) {
      const template = response.data[0] as DirectusPackTemplate
      await CMSCachePackTemplateModel.upsert(template)
      await this.generator.queueCreatePacksIfNeeded(template.id)
    }
  }

  private async syncCountries() {
    await this.syncApplication()
  }

  private async syncRarities() {
    await this.syncHomePage()
  }

  private async syncSet(setId: string, syncRelated = true) {
    const response = await this.cms?.findSets({
      filter: {
        id: {
          _eq: setId,
        },
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    if (response.data.length > 0) {
      const set = response.data[0] as unknown as DirectusSet
      await CMSCacheSetModel.upsert(set)

      if (syncRelated) {
        // Sync related NFT templates
        if (set.nft_templates) {
          await Promise.all(
            set.nft_templates.map((template) =>
              this.syncCollectibleTemplate(template.id)
            )
          )
        }

        // Sync related Collection
        if (set.collection) {
          await this.syncCollection(set.collection.id)
        }
      }
    }
  }

  private async syncPage(pageId: string) {
    const response = await this.cms?.findPages({
      filter: {
        id: {
          _eq: pageId,
        },
      },
    })

    if (response.data.length > 0) {
      await CMSCachePageModel.upsert(
        response.data[0] as unknown as DirectusPage
      )
    }
  }

  private async syncFaq(faqId: string) {
    const response = await this.cms?.findFaqs({
      filter: {
        id: {
          _eq: faqId,
        },
      },
    })

    if (response.data.length > 0) {
      await CMSCacheFaqModel.upsert(
        response.data[0] as unknown as DirectusFaqTemplate
      )
    }
  }

  async syncAllLanguages() {
    await CMSCacheLanguageModel.query().delete()

    const response = await this.cms?.findLanguages()

    for (const language of response.data) {
      await CMSCacheLanguageModel.upsert(language as DirectusLanguageTemplate)
    }
  }

  async syncAllPackTemplates() {
    const response = await this.cms?.findPackTemplates({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const packTemplate of response.data) {
      await CMSCachePackTemplateModel.upsert(
        packTemplate as DirectusPackTemplate
      )

      await this.generator.queueCreatePacksIfNeeded(packTemplate.id)
    }
  }

  async syncAllCollectibleTemplates() {
    const response = await this.cms?.findCollectibleTemplates({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const template of response.data) {
      await CMSCacheCollectibleTemplateModel.upsert(
        template as DirectusCollectibleTemplate
      )

      await this.generator.queueUploadCollectibleFilesIfNeeded(template.id)
    }
  }

  async syncAllTags() {
    const response = await this.cms?.findTags({
      filter: {},
    })

    for (const template of response.data) {
      await CMSCacheTagModel.upsert(template as DirectusTag)
    }
  }

  async syncAllCollections() {
    await CMSCacheCollectionModel.query().delete()

    const response = await this.cms?.findCollections({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const collection of response.data) {
      await CMSCacheCollectionModel.upsert(collection as DirectusCollection)
    }
  }

  async syncAllSets() {
    await CMSCacheSetModel.query().delete()

    const response = await this.cms?.findSets({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const set of response.data) {
      await CMSCacheSetModel.upsert(set as DirectusSet)
    }
  }

  async syncAllPages() {
    const response = await this.cms?.findPages({
      filter: {},
    })

    for (const page of response.data) {
      await CMSCachePageModel.upsert(page as DirectusPage)
    }
  }

  async syncAllFaqs() {
    await CMSCacheFaqModel.query().delete()

    const response = await this.cms?.findFaqs({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const faq of response.data) {
      await CMSCacheFaqModel.upsert(faq as DirectusFaqTemplate)
    }
  }

  async syncHomePage() {
    const homepage = await this.cms?.findHomepage()
    if (homepage?.id) {
      await CMSCacheHomepageModel.upsert(homepage)
    }
    return null
  }

  async syncApplication() {
    const application = await this.cms?.findApplication()

    await CMSCacheApplicationModel.upsert(application)

    return null
  }

  private async syncDeleteCollection(collectionId: string) {
    await CMSCacheCollectionModel.query().delete().where('id', collectionId)
  }

  private async syncDeleteFaq(faqId: string) {
    await CMSCacheFaqModel.query().delete().where('id', faqId)
  }

  private async syncDeleteLanguage(languageCode: string) {
    await CMSCacheLanguageModel.query().delete().where('code', languageCode)
  }

  private async syncDeleteTag(tagId: string) {
    const tagInstance = await CMSCacheTagModel.query()
      .where('id', tagId)
      .first()

    if (tagInstance) {
      // Directus should protect against deleting a Tag that is still in
      // use but this will cover potential sync issues

      const tagSlug = tagInstance.slug
      await CMSCacheCollectibleTemplateModel.removeTag(tagSlug)
      await CMSCachePackTemplateModel.removeTag(tagSlug)
      await CMSCacheTagModel.query().delete().where('id', tagId)
    }
  }

  private async syncDeleteSet(setId: string) {
    await CMSCacheSetModel.query().delete().where('id', setId)
  }

  private async syncDeletePage(pageId: string) {
    await CMSCachePageModel.query().delete().where('id', pageId)
  }

  // #endregion

  // #region webhook handlers
  async processWebhook(webhook: DirectusWebhook) {
    switch (webhook.event) {
      case 'items.create':
        return await this.processWebhookCreate(webhook)
      case 'items.update':
        return await this.processWebhookUpdate(webhook)
      case 'items.delete':
        return await this.processWebhookDelete(webhook)
      default:
        throw new Error(`unhandled directus webhook event: ${webhook.event}`)
    }
  }

  private async processWebhookCreate(webhook: DirectusWebhook) {
    switch (webhook.collection) {
      case 'application':
        return await this.syncApplication()
      case 'collections':
        return await this.syncCollection(webhook.key)
      case 'countries':
        // nothing to do for new countries. inserts are handled with application collection updates
        return null
      case 'homepage':
        return await this.syncHomePage()
      case 'languages':
        return await this.syncLanguage(webhook.key)
      case 'nft_templates':
        return await Promise.all([
          this.syncCollectibleTemplate(webhook.key),
          this.syncHomePage(),
        ])
      case 'tags':
        return await this.syncTag(webhook.key)
      case 'pack_templates':
        return await Promise.all([
          this.syncPackTemplate(webhook.key),
          this.syncHomePage(),
        ])
      case 'rarities':
        // nothing to do for new rarities. inserts are handled with collectible and homepage collection updates
        return null
      case 'sets':
        return await this.syncSet(webhook.key)
      case 'frequently_asked_questions':
        return await Promise.all([
          this.syncFaq(webhook.key),
          this.syncHomePage(),
        ])
      case 'static_page':
        return await this.syncPage(webhook.key)
      default:
        throw new Error(
          `unhandled directus webhook items.create event: ${webhook.collection}`
        )
    }
  }

  private async processWebhookUpdate(webhook: DirectusWebhook) {
    switch (webhook.collection) {
      case 'application':
        return await this.syncApplication()
      case 'collections':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncCollection(key)
        })
      case 'countries':
        return await this.syncCountries()
      case 'homepage':
        return await this.syncHomePage()
      case 'languages':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncLanguage(key)
        })
      case 'tags':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncTag(key)
        })
      case 'nft_templates':
        return await Promise.all([
          this.processWebhookKeys(webhook, async (key) => {
            await this.syncCollectibleTemplate(key)
          }),
          this.syncHomePage(),
        ])
      case 'pack_templates':
        return await Promise.all([
          this.processWebhookKeys(webhook, async (key) => {
            await this.syncPackTemplate(key)
          }),
          this.syncHomePage(),
        ])
      case 'rarities':
        return await Promise.all([
          this.syncRarities(),
          this.syncAllCollectibleTemplates(),
        ])
      case 'sets':
        return this.processWebhookKeys(webhook, async (key) => {
          await this.syncSet(key)
        })
      case 'frequently_asked_questions':
        return await Promise.all([
          this.processWebhookKeys(webhook, async (key) => {
            await this.syncFaq(key)
          }),
          this.syncHomePage(),
        ])
      case 'static_page':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncPage(key)
        })
      default:
        throw new Error(
          `unhandled directus webhook items.update event: ${webhook.collection}`
        )
    }
  }

  private async processWebhookKeys(
    webhook: DirectusWebhook,
    asyncFunction: (key: string) => Promise<void>
  ) {
    for (const key of webhook.keys) {
      await asyncFunction(key)
    }
  }

  private async processWebhookDelete(webhook: DirectusWebhook) {
    switch (webhook.collection) {
      case 'application':
        return null // Application should not be deleted, so we should ignore this occurrence
      case 'collections':
        return await Promise.all([
          this.processWebhookKeys(webhook, async (key) => {
            await this.syncDeleteCollection(key)
          }),
          this.syncAllCollectibleTemplates(),
        ])
      case 'countries':
        return await this.syncCountries() // This calls sync application which should just pull down updated countries list
      case 'frequently_asked_questions':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncDeleteFaq(key)
        })
      case 'languages':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncDeleteLanguage(key)
        })
      case 'tags':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncDeleteTag(key)
        })
      case 'nft_templates':
        return null // NFT Templates should not be deleted, so we should ignore this occurrence
      case 'pack_templates':
        return null // Pack Templates should not be deleted, so we should ignore this occurrence
      case 'rarities':
        return await Promise.all([
          this.syncRarities(),
          this.syncAllCollectibleTemplates(),
        ])
      case 'sets':
        return await Promise.all([
          this.processWebhookKeys(webhook, async (key) => {
            await this.syncDeleteSet(key)
          }),
          this.syncAllCollectibleTemplates(),
        ])
      case 'static_page':
        return await this.processWebhookKeys(webhook, async (key) => {
          await this.syncDeletePage(key)
        })
      default:
        throw new Error(
          `unhandled directus webhook items.delete event: ${webhook.collection}`
        )
    }
  }
  // #endregion
}
