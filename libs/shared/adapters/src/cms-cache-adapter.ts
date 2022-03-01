import pino from 'pino'
import {
  CollectibleBase,
  CollectionBase,
  CollectionWithSets,
  Country,
  DEFAULT_LOCALE,
  DirectusApplication,
  DirectusCountry,
  DirectusCountryTranslation,
  DirectusCollectibleTemplate,
  DirectusCollectibleTemplateTranslation,
  DirectusCollection,
  DirectusCollectionTranslation,
  DirectusFaqTemplate,
  DirectusFile,
  DirectusHomepage,
  DirectusLanguageTemplate,
  DirectusLanguageTemplateTranslation,
  DirectusPackTemplate,
  DirectusPackTemplateTranslation,
  DirectusPage,
  DirectusPageTranslation,
  DirectusRarity,
  DirectusRarityTranslation,
  DirectusSet,
  DirectusSetTranslation,
  DirectusStatus,
  DirectusTranslation,
  HomepageBase,
  PackBase,
  PackStatus,
  PackType,
  SetBase,
  SetWithCollection,
} from '@algomart/schemas'

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
} from '@algomart/shared/models'

import {
  isStringArray,
  isAfterNow,
  isNowBetweenDates,
  invariant,
} from '@algomart/shared/utils'

import { URL } from 'node:url'
import { Knex } from 'knex'

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

export interface ItemFilter {
  [key: string]:
    | string
    | string[]
    | number
    | number[]
    | boolean
    | boolean[]
    | Date
    | Date[]
    | ItemFilter
    | ItemFilter[]
}

export interface ItemQuery<TItem> {
  search?: string
  sort?: string[]
  filter?: ItemFilter
  limit?: number
  offset?: number
  page?: number
  deep?: ItemFilter
  totalCount?: boolean
  filterCount?: boolean
}

function getDirectusTranslation<TItem extends DirectusTranslation>(
  translations: TItem[] & DirectusTranslation[],
  invariantLabel: string,
  locale = DEFAULT_LOCALE
): TItem {
  invariant(
    typeof translations != 'number' && translations?.length > 0,
    `no translations found: ${invariantLabel}`
  )

  const translation =
    translations.find((translation) => translation.languages_code === locale) ||
    translations[0]
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
  locale = DEFAULT_LOCALE
): HomepageBase {
  const translation = getDirectusTranslation(
    homepage.translations,
    `homepage has no translations`,
    locale
  )

  return {
    heroBanner: getFileURL(homepage.hero_banner),
    heroBannerSubtitle: translation.hero_banner_subtitle,
    heroBannerTitle: translation.hero_banner_title,
    heroPackTemplate: toPackBase(homepage.hero_pack, getFileURL, locale),
    featuredNftsSubtitle: translation.featured_nfts_subtitle,
    featuredNftsTitle: translation.featured_nfts_title,
    featuredNftTemplates: (homepage.featured_nfts ?? []).map((collectible) =>
      toCollectibleBase(collectible, getFileURL, locale)
    ),
    featuredPacksSubtitle: translation.featured_packs_subtitle,
    featuredPacksTitle: translation.featured_packs_title,
    featuredPackTemplates: (homepage.featured_packs ?? []).map((collectible) =>
      toPackBase(collectible, getFileURL, locale)
    ),
  }
}

export function toSetBase(set: DirectusSet, locale = DEFAULT_LOCALE): SetBase {
  const { id, slug, translations, nft_templates } = set

  const { name } = getDirectusTranslation<DirectusSetTranslation>(
    translations as DirectusSetTranslation[],
    `set ${id} has no translations`,
    locale
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
  locale: string
): CollectionBase {
  const {
    id,
    slug,
    translations,
    reward_image,
    sets,
    nft_templates,
    collection_image,
  } = collection

  const translation = getDirectusTranslation<DirectusCollectionTranslation>(
    translations as DirectusCollectionTranslation[],
    `collection ${id} has no translations`,
    locale
  )

  invariant(
    !sets || !isStringArray(sets),
    'sets should not be an array of strings when provided'
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
  locale = DEFAULT_LOCALE
): SetWithCollection {
  const base = toSetBase(set, locale)

  invariant(typeof set.collection !== 'string', 'collection must be an object')

  return {
    ...base,
    collection: toCollectionBase(set.collection, getFileURL, locale),
  }
}

export function toCollectionWithSets(
  collection: DirectusCollection,
  getFileURL: GetFileURL,
  locale = DEFAULT_LOCALE
): CollectionWithSets {
  const base = toCollectionBase(collection, getFileURL, locale)

  invariant(!isStringArray(collection.sets), 'sets must be an array of objects')

  return {
    ...base,
    sets: collection.sets.map((set) => toSetBase(set)),
  }
}

export function toCollectibleBase(
  template: DirectusCollectibleTemplate,
  getFileURL: GetFileURL,
  locale = DEFAULT_LOCALE
): CollectibleBase {
  const translation =
    getDirectusTranslation<DirectusCollectibleTemplateTranslation>(
      template.translations as DirectusCollectibleTemplateTranslation[],
      `collectible ${template.id} has no translations`,
      locale
    )

  const rarity = template.rarity as DirectusRarity

  const rarityTranslation = rarity
    ? getDirectusTranslation<DirectusRarityTranslation>(
        rarity?.translations as DirectusRarityTranslation[],
        'expected rarity to include translations',
        locale
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
  locale: string
): Country {
  const translation = getDirectusTranslation<DirectusCountryTranslation>(
    country.countries_code.translations as DirectusCountryTranslation[],
    `country ${country.countries_code} has no translations`,
    locale
  )
  return {
    code: country.countries_code.code,
    name: translation.title,
  }
}

export function toPackBase(
  template: DirectusPackTemplate,
  getFileURL: GetFileURL,
  locale = DEFAULT_LOCALE
): PackBase {
  const translation = getDirectusTranslation<DirectusPackTemplateTranslation>(
    template.translations as DirectusPackTemplateTranslation[],
    `pack ${template.id} has no translations`,
    locale
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
      toCollectibleBase(nft_template, getFileURL, locale)
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

  async findApplication(knxRead?: Knex) {
    const queryResult = await CMSCacheApplicationModel.query(knxRead)
      .select('content')
      .first()

    const result: DirectusApplication =
      queryResult.content as unknown as DirectusApplication

    return result
  }

  async findAllCountries(locale = DEFAULT_LOCALE, knxRead?: Knex) {
    const application = await this.findApplication(knxRead)

    return application.countries.map((country) => {
      return toCountryBase(country, locale)
    })
  }

  async findAllPacksAuctionCompletion(
    startDate,
    locale = DEFAULT_LOCALE,
    knxRead?: Knex
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(knxRead)
      .where('type', PackType.Auction)
      .where('auctionUntil', '>', startDate)
      .select('content')
      .orderBy('releasedAt', 'desc')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): DirectusPackTemplate =>
        result.content as unknown as DirectusPackTemplate
    )

    return data.map((template) =>
      toPackBase(template, this.getFileURL.bind(this), locale)
    )
  }

  async findAllPacks(
    {
      locale = DEFAULT_LOCALE,
      page = 1,
      pageSize = 10,
      filter = {},
    }: {
      locale?: string
      page?: number
      pageSize?: number
      filter?: ItemFilter
    },
    knxRead?: Knex
  ) {
    const response = await this.findPackTemplates(
      {
        page,
        limit: pageSize,
        // Sort by released_at in descending order
        sort: ['-released_at'],
        filter: {
          ...filter,
        },
        filterCount: true,
      },
      knxRead
    )

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      packs: response.data.map((template) =>
        toPackBase(template, this.getFileURL.bind(this), locale)
      ),
      total: response.meta.filter_count,
    }
  }

  async findPacksByTemplateIds(
    templateIds,
    locale = DEFAULT_LOCALE,
    knxRead?: Knex
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(knxRead)
      .whereIn('templateId', templateIds)
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.getFileURL.bind(this), locale)
      }
    )

    return data
  }

  async findPacksByType(type, limit, locale = DEFAULT_LOCALE, knxRead?: Knex) {
    const queryResult = await CMSCachePackTemplateModel.query(knxRead)
      .whereIn('type', type)
      .limit(limit)
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.getFileURL.bind(this), locale)
      }
    )

    return data
  }

  async findPackBySlug(slug, locale = DEFAULT_LOCALE, knxRead?: Knex) {
    const queryResult = await CMSCachePackTemplateModel.query(knxRead)
      .findOne('slug', slug)
      .select('content')

    const packTemplate = queryResult.content as unknown as DirectusPackTemplate
    return toPackBase(packTemplate, this.getFileURL.bind(this), locale)
  }

  async findPackByTemplateId(
    templateId,
    locale = DEFAULT_LOCALE,
    knxRead?: Knex
  ) {
    const queryResult = await CMSCachePackTemplateModel.query(knxRead)
      .findOne('id', templateId)
      .select('content')

    const packTemplate = queryResult.content as unknown as DirectusPackTemplate
    return toPackBase(packTemplate, this.getFileURL.bind(this), locale)
  }

  async findPacksPendingGeneration(locale = DEFAULT_LOCALE, knxRead?: Knex) {
    const queryResult = await CMSCachePackTemplateModel.query(knxRead)
      .leftJoin('Pack', 'Pack.templateId', 'CmsCachePackTemplates.id')
      .whereNull('Pack.templateId')
      .distinctOn('CmsCachePackTemplates.id')
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): PackBase => {
        const packTemplate = result.content as unknown as DirectusPackTemplate
        return toPackBase(packTemplate, this.getFileURL.bind(this), locale)
      }
    )

    return data
  }

  async findAllCollectibles(
    locale = DEFAULT_LOCALE,
    filter: ItemFilter = {},
    limit = -1,
    knxRead?: Knex
  ) {
    const response = await this.findCollectibleTemplates(
      {
        filter: {
          status: {
            _eq: DirectusStatus.Published,
          },
          ...filter,
        },
        limit,
        filterCount: true,
      },
      knxRead
    )

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collectibles: response.data.map((template) =>
        toCollectibleBase(template, this.getFileURL.bind(this), locale)
      ),
      total: response.meta.filter_count,
    }
  }

  async findCollectiblesByTemplateIds(
    templateIds,
    locale = DEFAULT_LOCALE,
    knxRead?: Knex
  ) {
    const queryResult = await CMSCacheCollectibleTemplateModel.query(knxRead)
      .whereIn('id', templateIds)
      .select('content')

    const data = queryResult.map(
      (result: CMSCacheCollectibleTemplateModel): CollectibleBase => {
        const collectibleTemplate =
          result.content as unknown as DirectusCollectibleTemplate
        return toCollectibleBase(
          collectibleTemplate,
          this.getFileURL.bind(this),
          locale
        )
      }
    )

    return data
  }

  async findCollectibleByTemplateId(
    templateId: string,
    knxRead: Knex,
    locale = DEFAULT_LOCALE
  ) {
    const queryResult = await CMSCacheCollectibleTemplateModel.query(knxRead)
      .findOne('id', templateId)
      .select('content')

    const collectibleTemplate =
      queryResult.content as unknown as DirectusCollectibleTemplate
    return toCollectibleBase(
      collectibleTemplate,
      this.getFileURL.bind(this),
      locale
    )
  }

  async findAllCollections(locale = DEFAULT_LOCALE, knxRead?: Knex) {
    const response = await this.findCollections({ filterCount: true }, knxRead)

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collections: response.data.map((c) =>
        toCollectionWithSets(c, this.getFileURL.bind(this), locale)
      ),
      total: response.meta.filter_count,
    }
  }

  async findCollectionBySlug(
    slug: string,
    locale = DEFAULT_LOCALE,
    knxRead?: Knex
  ) {
    const result = await CMSCacheCollectionModel.query(knxRead).findOne(
      'slug',
      slug
    )

    if (result) {
      const collection: DirectusCollection =
        result.content as unknown as DirectusCollection
      return toCollectionWithSets(
        collection,
        this.getFileURL.bind(this),
        locale
      )
    }

    return null
  }

  async findSetBySlug(slug: string, locale = DEFAULT_LOCALE, knxRead?: Knex) {
    const result = await CMSCacheSetModel.query(knxRead).findOne('slug', slug)

    if (result) {
      const set: DirectusSet = result.content as unknown as DirectusSet
      return toSetWithCollection(set, this.getFileURL.bind(this), locale)
    }

    return null
  }

  async getPage(slug, locale = DEFAULT_LOCALE, knexRead?: Knex) {
    const result = await CMSCachePageModel.query(knexRead).findOne('slug', slug)

    if (result) {
      const page: DirectusPage = result.content as unknown as DirectusPage

      const pageTranslations = getDirectusTranslation<DirectusPageTranslation>(
        page.translations as DirectusPageTranslation[],
        `No translations found for slug "${slug}"`,
        locale
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

  async getFaqs(locale: string = DEFAULT_LOCALE, knxRead?: Knex) {
    const queryResult = await CMSCacheFaqModel.query(knxRead).select('content')
    const data = queryResult.map(
      (result: CMSCacheFaqModel): DirectusFaqTemplate =>
        result.content as unknown as DirectusFaqTemplate
    )

    return data.map((d) =>
      getDirectusTranslation(d.translations, `faq has no translations`, locale)
    )
  }

  async findHomepage(locale: string = DEFAULT_LOCALE, knxRead?: Knex) {
    const queryResult = await CMSCacheHomepageModel.query(knxRead)
      .select('content')
      .first()
    const result: DirectusHomepage =
      queryResult.content as unknown as DirectusHomepage

    return toHomepageBase(result, this.getFileURL.bind(this), locale)
  }

  async getLanguages(locale = DEFAULT_LOCALE, knxRead?: Knex) {
    const queryResult = await CMSCacheLanguageModel.query(knxRead).select(
      'content'
    )

    const data = queryResult.map(
      (result: CMSCacheLanguageModel): DirectusLanguageTemplate =>
        result.content as unknown as DirectusLanguageTemplate
    )

    return data.map((directusLanguageTemplate) => ({
      languages_code: directusLanguageTemplate.code,
      label: getDirectusTranslation<DirectusLanguageTemplateTranslation>(
        directusLanguageTemplate.translations as DirectusLanguageTemplateTranslation[],
        `language has no translations`,
        locale
      )?.label,
    }))
  }

  private async findPackTemplates(
    query: ItemQuery<DirectusPackTemplate> = {},
    knxRead?: Knex
  ) {
    // TODO: Break apart the query input and translate into SQL clauses

    // {
    //   "currency": "EURO",
    //   "locale": "en-US",
    //   "page": "2",
    //   "pageSize": "9",
    //   "priceHigh": "50000",
    //   "priceLow": "0",
    //   "reserveMet": "false",
    //   "sortBy": "title",
    //   "sortDirection": "asc",
    //   "status": [
    //     "Expired",
    //     "Active",
    //     "Upcoming"
    //   ],
    //   "type": [
    //     "auction",
    //     "purchase"
    //   ]
    // }

    // TODO: Convert the input priceHigh and priceLow from the input Currency to USD before adding the where clause.
    // All the items in the database are stored in USD

    const queryResult = await CMSCachePackTemplateModel.query(knxRead)
      .orWhere('releasedAt', null)
      .orWhere('releasedAt', '<', new Date())
      .select('content')

    const data = queryResult.map(
      (result: CMSCachePackTemplateModel): DirectusPackTemplate =>
        result.content as unknown as DirectusPackTemplate
    )
    const result: ItemsResponse<DirectusPackTemplate> = {
      data: data,
      meta: {
        filter_count: 1,
        total_count: 1,
      },
    }

    return result
  }

  private async findCollectibleTemplates(
    query: ItemQuery<DirectusCollectibleTemplate> = {},
    knxRead?: Knex
  ) {
    const queryResult = await CMSCacheCollectibleTemplateModel.query(
      knxRead
    ).select('content')

    const data = queryResult.map(
      (result: CMSCacheCollectibleTemplateModel): DirectusCollectibleTemplate =>
        result.content as unknown as DirectusCollectibleTemplate
    )

    const result: ItemsResponse<DirectusCollectibleTemplate> = {
      data: data,
      meta: {
        filter_count: 1,
        total_count: 1,
      },
    }

    return result
  }

  private async findCollections(
    query: ItemQuery<DirectusCollection> = {},
    knxRead?: Knex
  ) {
    const queryResult = await CMSCacheCollectionModel.query(knxRead).select(
      'content'
    )

    const data = queryResult.map(
      (result: CMSCacheCollectionModel): DirectusCollection =>
        result.content as unknown as DirectusCollection
    )

    const result: ItemsResponse<DirectusCollection> = {
      data: data,
      meta: {
        filter_count: 1,
        total_count: 1,
      },
    }

    return result
  }

  private async findSets(query: ItemQuery<DirectusSet> = {}, knxRead?: Knex) {
    const queryResult = await CMSCacheSetModel.query(knxRead).select('content')
    const data = queryResult.map(
      (result: CMSCacheSetModel): DirectusSet =>
        result.content as unknown as DirectusSet
    )
    const result: ItemsResponse<DirectusSet> = {
      data: data,
      meta: {
        filter_count: 1,
        total_count: 1,
      },
    }

    return result
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
