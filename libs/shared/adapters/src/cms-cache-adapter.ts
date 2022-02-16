import {
  CollectibleBase,
  CollectionBase,
  CollectionWithSets,
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
import { json } from 'node:stream/consumers'
import { URL, URLSearchParams } from 'node:url'

import { CMSCacheCollectibleTemplateModel } from '@/models/cms-cache-collectible-template.model'
import { CMSCacheCollectionModel } from '@/models/cms-cache-collection.model'
import { CMSCacheFaqModel } from '@/models/cms-cache-faq.model'
import { CMSCacheHomepageModel } from '@/models/cms-cache-homepage.model'
import { CMSCacheLanguageModel } from '@/models/cms-cache-language.model'
import { CMSCachePackTemplateModel } from '@/models/cms-cache-pack-template.model'
import { CMSCachePageModel } from '@/models/cms-cache-page.model'
import { CMSCacheSetModel } from '@/models/cms-cache-set.model'
import { isStringArray } from '@/utils/arrays'
import { isAfterNow, isNowBetweenDates } from '@/utils/date-time'
import { invariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

// #region CMS Types

export interface DirectusHomepage {
  id: string
  featured_pack: null | string | DirectusPackTemplate
  upcoming_packs: null | string[] | DirectusPackTemplate[]
  notable_collectibles: null | string[] | DirectusCollectibleTemplate[]
}

export enum DirectusStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}

export interface DirectusTranslation {
  languages_code: string
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

export interface DirectusPackFile {
  id: string
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

export type GetFileURL = (file: DirectusFile) => string

export function toHomepageBase(homepage: DirectusHomepage): HomepageBase {
  invariant(
    homepage.featured_pack === null ||
      typeof homepage.featured_pack === 'string',
    'featured_pack must be null or a string'
  )
  invariant(
    homepage.upcoming_packs === null ||
      homepage.upcoming_packs.length === 0 ||
      isStringArray(homepage.upcoming_packs),
    'upcoming_packs must be empty or an array of strings'
  )

  return {
    featuredPackTemplateId:
      typeof homepage.featured_pack === 'string'
        ? homepage.featured_pack
        : homepage.featured_pack?.id,
    upcomingPackTemplateIds: (homepage.upcoming_packs ?? []) as string[],
    notableCollectibleTemplateIds: (homepage.notable_collectibles ??
      []) as string[],
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
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly options: CMSCacheAdapterOptions) {}

  private async findPackTemplates(query: ItemQuery<DirectusPackTemplate> = {}) {
    const defaultQuery: ItemQuery<DirectusPackTemplate> = {
      filter: {},
      limit: -1,
    }

    const queryParams = {
      ...defaultQuery,
      ...query,
    }

    const queryResult = await CMSCachePackTemplateModel.query()
      .limit(queryParams.limit)
      .select('content')

    const jsonResult = queryResult.map((result) => result.content)
    const result: ItemsResponse<DirectusPackTemplate> = JSON.parse(
      `[${jsonResult.join(', ')}]`
    )

    return result
  }

  private async findCollectibleTemplates(
    query: ItemQuery<DirectusCollectibleTemplate> = {}
  ) {
    const defaultQuery: ItemQuery<DirectusCollectibleTemplate> = {
      filter: {},
      limit: -1,
    }

    const queryParams = {
      ...defaultQuery,
      ...query,
    }

    const queryResult = await CMSCacheCollectibleTemplateModel.query()
      .limit(queryParams.limit)
      .select('content')

    const jsonResult = queryResult.map((result) => result.content)
    const result: ItemsResponse<DirectusCollectibleTemplate> = JSON.parse(
      `[${jsonResult.join(', ')}]`
    )

    return result
  }

  private async findCollections(query: ItemQuery<DirectusCollection> = {}) {
    const defaultQuery: ItemQuery<DirectusCollection> = {
      filter: {},
      limit: -1,
    }

    const queryParams = {
      ...defaultQuery,
      ...query,
    }

    const queryResult = await CMSCacheCollectionModel.query()
      .limit(queryParams.limit)
      .select('content')

    const jsonResult = queryResult.map((result) => result.content)
    const result: ItemsResponse<DirectusCollection> = JSON.parse(
      `[${jsonResult.join(', ')}]`
    )

    return result
  }

  private async findSets(query: ItemQuery<DirectusSet> = {}) {
    const defaultQuery: ItemQuery<DirectusSet> = {
      filter: {},
      limit: -1,
    }

    const queryParams = {
      ...defaultQuery,
      ...query,
    }

    const queryResult = await CMSCacheSetModel.query()
      .limit(queryParams.limit)
      .select('content')

    const jsonResult = queryResult.map((result) => result.content)
    const result: ItemsResponse<DirectusSet> = JSON.parse(
      `[${jsonResult.join(', ')}]`
    )

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

    if (response.data.length === 0) return null
    const pack = response.data[0]
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
    })

    if (response.data.length === 0) return null
    const collection = response.data[0]
    return toCollectionWithSets(collection, this.getFileURL.bind(this), locale)
  }

  async findSetBySlug(slug: string, locale = DEFAULT_LOCALE) {
    const results = await CMSCacheSetModel.query().where('slug', slug)

    if (results.length === 0) {
      return null
    }
    const set: DirectusSet = JSON.parse(results[0].content)
    return toSetWithCollection(set, this.getFileURL.bind(this), locale)
  }

  async getDirectusPage(slug, locale = DEFAULT_LOCALE) {
    const results = await CMSCachePageModel.query().where('slug', slug)

    if (results.length === 0) {
      return null
    }

    const result = JSON.parse(results[0].content)

    return getDirectusTranslation<DirectusPageTranslation>(
      result.translations as DirectusPageTranslation[],
      `No translations found for slug "${slug}"`,
      locale
    )
  }

  async getFaqs(locale: string = DEFAULT_LOCALE) {
    const queryResult = await CMSCacheFaqModel.query().select('content')
    const jsonResult = queryResult.map((result) => result.content)
    const result: ItemsResponse<DirectusFaqTemplate> = JSON.parse(
      `[${jsonResult.join(', ')}]`
    )

    return result.data.map((d) =>
      getDirectusTranslation(d.translations, `faq has no translations`, locale)
    )
  }

  async findHomepage() {
    const queryResult = await CMSCacheHomepageModel.query().select('content')
    const result: ItemByIdResponse<DirectusHomepage> = JSON.parse(
      queryResult[0].content
    )

    return toHomepageBase(result.data)
  }

  async getLanguages(locale = DEFAULT_LOCALE) {
    const queryResult = await CMSCacheLanguageModel.query().select('content')
    const jsonResult = queryResult.map((result) => result.content)
    const result: ItemsResponse<DirectusLanguageTemplate> = JSON.parse(
      `[${jsonResult.join(', ')}]`
    )

    return result.data.map((directusLanguageTemplate) => ({
      languages_code: directusLanguageTemplate.code,
      label: getDirectusTranslation<DirectusLanguageTemplateTranslation>(
        directusLanguageTemplate.translations as DirectusLanguageTemplateTranslation[],
        `language has no translations`,
        locale
      )?.label,
    }))
  }
}
