import pino from 'pino'
import {
  CollectibleBase,
  CollectionBase,
  CollectionWithSets,
  Countries,
  DEFAULT_LOCALE,
  HomepageBase,
  PackBase,
  PackCollectibleDistribution,
  PackCollectibleOrder,
  PackStatus,
  PackType,
  SetBase,
  SetWithCollection,
} from '@algomart/schemas'
import got, { Got } from 'got'
import { URL, URLSearchParams } from 'node:url'

import {
  isStringArray,
  isAfterNow,
  isNowBetweenDates,
  invariant,
} from '@algomart/shared/utils'

// #region CMS Types

export interface DirectusTranslation {
  languages_code: string
}

export interface DirectusHomepageTranslation extends DirectusTranslation {
  featured_packs_subtitle?: string
  featured_packs_title?: string
  featured_nfts_title?: string
  featured_nfts_subtitle?: string
  hero_banner_title?: string
  hero_banner_subtitle?: string
}

export interface DirectusHomepage {
  id: string
  hero_banner: DirectusFile | null
  hero_pack: null | string | DirectusPackTemplate
  featured_packs: null | string[] | DirectusPackTemplate[]
  featured_nfts: null | string[] | DirectusCollectibleTemplate[]
  translations: DirectusHomepageTranslation[]
}

export enum DirectusStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export interface DirectusPackTemplateTranslation extends DirectusTranslation {
  title: string
  subtitle: string | null
  body: string | null
}

export interface DirectusFile {
  id: string
  filename_disk: string
  storage: string
  title: string
  type: string
  width: number
  height: number
}

export interface DirectusPackFile extends DirectusFile {
  directus_files_id: string
}

export interface DirectusRarityTranslation extends DirectusTranslation {
  name: string
}

export interface DirectusRarity {
  code: string
  color: string
  id: string
  translations: number[] | DirectusRarityTranslation[]
}

export interface DirectusSetTranslation extends DirectusTranslation {
  name: string
}

export interface DirectusSet {
  id: string
  status: DirectusStatus
  sort: number
  slug: string
  collection: string | DirectusCollection
  nft_templates: string[] | DirectusCollectibleTemplate[]
  translations: number[] | DirectusSetTranslation[]
}

export interface DirectusCollectionTranslation extends DirectusTranslation {
  name: string
  description: string | null
  metadata: Record<string, string | number | boolean> | null
  reward_prompt: string | null
  reward_complete: string | null
}

export interface DirectusPageTranslation extends DirectusTranslation {
  body: string
  title: string
}

export interface DirectusCollection {
  id: string
  status: DirectusStatus
  sort: number
  slug: string
  collection_image: DirectusFile
  translations: number[] | DirectusCollectionTranslation[]
  sets: string[] | DirectusSet[]
  nft_templates: string[] | DirectusCollectibleTemplate[]
  reward_image: DirectusFile | null
}

export interface DirectusCollectibleTemplateTranslation
  extends DirectusTranslation {
  title: string
  subtitle: string | null
  body: string | null
}

export interface DirectusCollectibleTemplate {
  id: string
  status: DirectusStatus
  total_editions: number
  preview_image: DirectusFile
  preview_video: DirectusFile | null
  preview_audio: DirectusFile | null
  asset_file: DirectusFile | null
  rarity: string | DirectusRarity | null
  unique_code: string
  pack_template: string | DirectusPackTemplate
  translations: number[] | DirectusCollectibleTemplateTranslation[]
  collection: string | DirectusCollection | null
  set: string | DirectusSet | null
}

export interface DirectusPackTemplate {
  additional_images: string[] | DirectusPackFile[]
  allow_bid_expiration: boolean
  auction_until: string | null
  id: string
  one_pack_per_customer: boolean
  nft_distribution: PackCollectibleDistribution
  nft_order: PackCollectibleOrder
  nft_templates: string[] | DirectusCollectibleTemplate[]
  nft_category: string
  nfts_per_pack: number
  pack_image: DirectusFile
  price: number | null
  released_at: string | null
  show_nfts: boolean
  slug: string
  status: DirectusStatus
  translations: number[] | DirectusPackTemplateTranslation[]
  type: PackType
}

export interface DirectusLanguageTemplate {
  code: string
  translations: DirectusLanguageTemplateTranslation[]
}

export interface DirectusLanguageTemplateTranslation
  extends DirectusTranslation {
  label: string
}

export interface DirectusFaqTemplateTranslation extends DirectusTranslation {
  question: string | null
  answer: string | null
}

export interface DirectusFaqTemplate {
  translations: DirectusFaqTemplateTranslation[]
}

export interface DirectusCountry {
  id: string
  application_id: string
  countries_code: string
}

export interface DirectusApplication {
  id: string
  currency?: string | null
  countries?: DirectusCountry[] | null
}

export interface DirectusCountryWithTranslations {
  code: string
  translations?: number[] | DirectusCountryTranslation[]
}

export interface DirectusCountryTranslation extends DirectusTranslation {
  id: number
  countries_code: string
  languages_code: string
  title: string | null
}

// #endregion

// #region Directus Helpers

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
  fields?: (keyof TItem | string)[]
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

function getParameters<TItem>(query?: ItemQuery<TItem>) {
  const parameters = new URLSearchParams()

  if (query?.fields) {
    parameters.set('fields', query.fields.join(','))
  }

  if (query?.search) {
    parameters.set('search', query.search)
  }

  if (query?.sort) {
    parameters.set('sort', query.sort.join(','))
  }

  if (query?.limit) {
    parameters.set('limit', query.limit.toString())
  }

  if (query?.offset) {
    parameters.set('offset', query.offset.toString())
  }

  if (query?.page) {
    parameters.set('page', query.page.toString())
  }

  if (query?.filter) {
    parameters.set('filter', JSON.stringify(query.filter))
  }

  if (query?.deep) {
    parameters.set('deep', JSON.stringify(query.deep))
  }

  if (query?.totalCount || query?.filterCount) {
    parameters.set(
      'meta',
      query.totalCount && query.filterCount
        ? '*'
        : query.totalCount
          ? 'total_count'
          : 'filter_count'
    )
  }

  return parameters
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

export type GetFileURL = (file: DirectusFile | string) => string

export function toHomepageBase(
  homepage: DirectusHomepage,
  getFileURL: GetFileURL,
  locale = DEFAULT_LOCALE
): HomepageBase {
  invariant(
    homepage.hero_pack === null || typeof homepage.hero_pack === 'string',
    'hero_pack must be null or a string'
  )
  invariant(
    homepage.featured_packs === null ||
    homepage.featured_packs.length === 0 ||
    isStringArray(homepage.featured_packs),
    'featured_packs must be empty or an array of strings'
  )

  const translation = getDirectusTranslation(
    homepage.translations,
    `homepage has no translations`,
    locale
  )

  return {
    heroBanner: getFileURL(homepage.hero_banner),
    heroBannerSubtitle: translation.hero_banner_subtitle,
    heroBannerTitle: translation.hero_banner_title,
    heroPackTemplateId:
      typeof homepage.hero_pack === 'string'
        ? homepage.hero_pack
        : homepage.hero_pack?.id,
    featuredNftsSubtitle: translation.featured_nfts_subtitle,
    featuredNftsTitle: translation.featured_nfts_title,
    featuredNftTemplateIds: (homepage.featured_nfts ?? []) as string[],
    featuredPacksSubtitle: translation.featured_packs_subtitle,
    featuredPacksTitle: translation.featured_packs_title,
    featuredPackTemplateIds: (homepage.featured_packs ?? []) as string[],
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
    allowBidExpiration: template.allow_bid_expiration,
    additionalImages: !isStringArray(template.additional_images)
      ? template.additional_images.map((packFile) => getFileURL(packFile))
      : undefined,
    auctionUntil: template.auction_until ?? undefined,
    body: translation.body ?? undefined,
    collectibleTemplateIds: isStringArray(template.nft_templates)
      ? template.nft_templates
      : template.nft_templates.map((t) => t.id),
    config: {
      collectibleDistribution: template.nft_distribution,
      collectibleOrder: template.nft_order,
      collectiblesPerPack: template.nfts_per_pack,
    },
    image: getFileURL(template.pack_image),
    onePackPerCustomer: template.one_pack_per_customer,
    price: template.price || 0,
    nftCategory: template.nft_category ?? undefined,
    nftsPerPack: template.nfts_per_pack,
    releasedAt: template.released_at ?? undefined,
    slug: template.slug,
    status: toStatus(template),
    subtitle: translation.subtitle ?? undefined,
    templateId: template.id,
    title: translation.title,
    type: template.type,
  }
}

export function toCountryBase(
  template: DirectusCountryWithTranslations,
  locale: string
) {
  const translation = getDirectusTranslation<DirectusCountryTranslation>(
    template.translations as DirectusCountryTranslation[],
    `country ${template.code} has no translations`,
    locale
  )
  return {
    code: template.code,
    name: translation.title,
  }
}

// #endregion

export interface DirectusAdapterOptions {
  cmsUrl: string
  gcpCdnUrl: string
  accessToken: string
}

export default class DirectusAdapter {
  logger: pino.Logger<unknown>
  http: Got

  constructor(
    private readonly options: DirectusAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })

    this.http = got.extend({
      prefixUrl: options.cmsUrl,
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
      },
    })

    this.testConnection()
  }

  async testConnection() {
    try {
      await this.ensureFilePermission()
      this.logger.info('Successfully connected to CMS')
    } catch (error) {
      this.logger.error(error, 'Failed to connect to CMS')
    }
  }

  async ensureFilePermission() {
    const permissions = await this.http
      .get('permissions', {
        searchParams: {
          fields: 'id,role,collection,action,fields',
          'filter[collection][_eq]': 'directus_files',
          'filter[fields][_in]': '*',
          'filter[action][_eq]': 'read',
        },
      })
      .json<{
        data: Array<{
          id: number
          role: string | null
          collection: string
          action: 'create' | 'read' | 'update' | 'delete'
          fields: string[]
        }>
      }>()

    if (permissions.data.length === 0) {
      await this.http.post('permissions', {
        json: {
          collection: 'directus_files',
          fields: ['*'],
          action: 'read',
          role: null,
        },
      })
    }
  }

  private async findMany<TItem>(
    collection: string,
    query: ItemQuery<TItem> = {}
  ): Promise<ItemsResponse<TItem>> {
    const response = await this.http.get(`items/${collection}`, {
      searchParams: getParameters(query),
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const result: ItemsResponse<TItem> = JSON.parse(response.body)
      return result
    }

    return { data: [] }
  }

  private async findPackTemplates(query: ItemQuery<DirectusPackTemplate> = {}) {
    const defaultQuery: ItemQuery<DirectusPackTemplate> = {
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: ['*.*'],
    }

    return await this.findMany<DirectusPackTemplate>('pack_templates', {
      ...defaultQuery,
      ...query,
    })
  }

  private async findCollectibleTemplates(
    query: ItemQuery<DirectusCollectibleTemplate> = {}
  ) {
    const defaultQuery: ItemQuery<DirectusCollectibleTemplate> = {
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: ['*.*'],
    }

    return await this.findMany<DirectusCollectibleTemplate>('nft_templates', {
      ...defaultQuery,
      ...query,
    })
  }

  private async findCollections(query: ItemQuery<DirectusCollection> = {}) {
    const defaultQuery: ItemQuery<DirectusCollection> = {
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: ['*.*'],
    }

    return await this.findMany<DirectusCollection>('collections', {
      ...defaultQuery,
      ...query,
    })
  }

  private async findSets(query: ItemQuery<DirectusSet> = {}) {
    const defaultQuery: ItemQuery<DirectusSet> = {
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: ['*.*'],
    }

    return await this.findMany<DirectusSet>('sets', {
      ...defaultQuery,
      ...query,
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

  private async findCountries(query: ItemQuery<{ filter: ItemFilter }> = {}) {
    const defaultQuery: ItemQuery<DirectusCountryWithTranslations> = {
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: ['*.*'],
    }

    return await this.findMany<DirectusCountryWithTranslations>('countries', {
      ...defaultQuery,
      ...query,
    })
  }

  async findAllPacks({
    locale = DEFAULT_LOCALE,
    page = 1,
    pageSize = 10,
    filter = {},
  }: {
    locale?: string
    page?: number
    pageSize?: number
    filter?: ItemFilter
  }) {
    const response = await this.findPackTemplates({
      page,
      limit: pageSize,
      // Sort by released_at in descending order
      sort: ['-released_at'],
      filter: {
        ...filter,
      },
      filterCount: true,
    })

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

  async findPack(filter: ItemFilter = {}, locale = DEFAULT_LOCALE) {
    const response = await this.findPackTemplates({
      limit: 1,
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
        ...filter,
      },
    })

    if (response?.data?.length === 0) return null
    const pack = response.data[response?.data?.length - 1]
    return toPackBase(pack, this.getFileURL.bind(this), locale)
  }

  async findAllCollectibles(
    locale = DEFAULT_LOCALE,
    filter: ItemFilter = {},
    limit = -1
  ) {
    const response = await this.findCollectibleTemplates({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
        ...filter,
      },
      limit,
      fields: [
        'id',
        'total_editions',
        'unique_code',
        'preview_image.*',
        'preview_video.*',
        'preview_audio.*',
        'asset_file.*',
        'translations.*',
        'rarity.code',
        'rarity.color',
        'rarity.translations.*',
        'set.id',
        'set.collection.id',
        'collection',
      ],
      filterCount: true,
    })

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

  async findAllCollections(locale = DEFAULT_LOCALE) {
    const response = await this.findCollections({
      fields: [
        'collection_image.*',
        'id',
        'nft_templates',
        'reward_image.*',
        'slug',
        'translations.*',
        'sets.id',
        'sets.nft_templates',
        'sets.slug',
        'sets.translations.*',
      ],
      filterCount: true,
    })

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

  async findCollectionBySlug(slug: string, locale = DEFAULT_LOCALE) {
    const response = await this.findCollections({
      limit: 1,
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
        slug: {
          _eq: slug,
        },
      },
      fields: [
        'collection_image.*',
        'id',
        'nft_templates',
        'reward_image.*',
        'sets.id',
        'sets.nft_templates',
        'sets.slug',
        'sets.translations.*',
        'slug',
        'translations.*',
      ],
    })

    if (response.data.length === 0) return null
    const collection = response.data[0]
    return toCollectionWithSets(collection, this.getFileURL.bind(this), locale)
  }

  async findSetBySlug(slug: string, locale = DEFAULT_LOCALE) {
    const response = await this.findSets({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
        slug: {
          _eq: slug,
        },
      },
      fields: [
        'collection.collection_image.*',
        'collection.id',
        'collection.nft_templates',
        'collection.reward_image.*',
        'collection.slug',
        'collection.translations.*',
        'id',
        'nft_templates',
        'slug',
        'translations.*',
      ],
      limit: 1,
    })

    if (response.data.length === 0) return null
    const set = response.data[0]
    return toSetWithCollection(set, this.getFileURL.bind(this), locale)
  }

  async getDirectusPage(slug, locale = DEFAULT_LOCALE) {
    const response = await this.http.get('items/page', {
      searchParams: getParameters({
        filter: {
          slug: {
            _eq: slug,
          },
        },
        fields: ['*.*'],
      }),
    })

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body).data
      if (!Array.isArray(data) || (Array.isArray(data) && data.length === 0))
        invariant(`Page data for slug "${slug}" not found`)
      return getDirectusTranslation<DirectusPageTranslation>(
        data[0].translations as DirectusPageTranslation[],
        `No translations found for slug "${slug}"`,
        locale
      )
    }
    return null
  }

  async getFaqs(locale: string = DEFAULT_LOCALE) {
    const defaultQuery: ItemQuery<DirectusFaqTemplate> = {
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: ['*.*'],
    }

    const response = await this.findMany<DirectusFaqTemplate>('faqs', {
      ...defaultQuery,
    })

    // simplify response
    return response.data.map((d) =>
      getDirectusTranslation(d.translations, `faq has no translations`, locale)
    )
  }

  async findPublishedCountries(
    filter: ItemFilter = {},
    locale = DEFAULT_LOCALE
  ): Promise<Countries | null> {
    const response = await this.findCountries({ filter })
    if (response.data.length === 0) return null
    const countries = response.data
    return countries.map((country) => toCountryBase(country, locale))
  }

  async findHomepage(locale: string = DEFAULT_LOCALE) {
    // Homepage is a singleton in the CMS, which makes this endpoint only return a single item.
    // Therefore we should avoid using the `findMany` method and instead act as if the result is
    // from a `findById` call.
    const response = await this.http.get('items/homepage', {
      searchParams: getParameters({
        fields: [
          'hero_banner',
          'hero_pack',
          'featured_packs',
          'featured_nfts',
          'translations.*',
        ],
        deep: {
          hero_pack: {
            _filter: {
              status: {
                _eq: DirectusStatus.Published,
              },
            },
          },
          featured_packs: {
            _filter: {
              status: {
                _eq: DirectusStatus.Published,
              },
            },
          },
          featured_nfts: {
            _filter: {
              status: {
                _eq: DirectusStatus.Published,
              },
            },
          },
        },
      }),
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const result: ItemByIdResponse<DirectusHomepage> = JSON.parse(
        response.body
      )
      return toHomepageBase(result.data, this.getFileURL.bind(this), locale)
    }

    return null
  }

  async getLanguages(locale = DEFAULT_LOCALE) {
    const defaultQuery: ItemQuery<DirectusLanguageTemplate> = {
      limit: -1,
      fields: ['*.*'],
    }

    const response = await this.findMany<DirectusLanguageTemplate>(
      `languages`,
      {
        ...defaultQuery,
      }
    )

    return response.data.map((directusLanguageTemplate) => ({
      languages_code: directusLanguageTemplate.code,
      label: getDirectusTranslation<DirectusLanguageTemplateTranslation>(
        directusLanguageTemplate.translations as DirectusLanguageTemplateTranslation[],
        `language has no translations`,
        locale
      )?.label,
    }))
  }

  async findApplication(): Promise<DirectusApplication | null> {
    // Application is a singleton in the CMS, which makes this endpoint only return a single item.
    // Therefore we should avoid using the `findMany` method and instead act as if the result is
    // from a `findById` call.
    const response = await this.http.get('items/application', {
      searchParams: getParameters({
        fields: ['*.*'],
      }),
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const result: ItemByIdResponse<DirectusApplication> = JSON.parse(
        response.body
      )
      return result.data
    }

    return null
  }
}
