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
import got, { Got } from 'got'
import { URL, URLSearchParams } from 'node:url'

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

export interface DirectusPackTemplateTranslation {
  language_code: string
  title: string
  subtitle: string | null
  body: string | null
}

export interface DirectusFile {
  id: string
  title: string
  type: string
  width: number
  height: number
}

export interface DirectusPackFile {
  id: string
  directus_files_id: string
}

export interface DirectusRarityTranslation {
  language_code: string
  name: string
}

export interface DirectusRarity {
  code: string
  color: string
  id: string
  translations: number[] | DirectusRarityTranslation[]
}

export interface DirectusSetTranslation {
  language_code: string
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

export interface DirectusCollectionTranslation {
  language_code: string
  name: string
  description: string | null
  metadata: Record<string, string | number | boolean> | null
  reward_prompt: string | null
  reward_complete: string | null
}

export interface DirectusCollection {
  id: string
  status: DirectusStatus
  sort: number
  slug: string
  collection_image: string | DirectusFile
  translations: number[] | DirectusCollectionTranslation[]
  sets: string[] | DirectusSet[]
  nft_templates: string[] | DirectusCollectibleTemplate[]
  reward_image: string | DirectusFile | null
}

export interface DirectusCollectibleTemplateTranslation {
  language_code: string
  title: string
  subtitle: string | null
  body: string | null
}

export interface DirectusCollectibleTemplate {
  id: string
  status: DirectusStatus
  total_editions: number
  preview_image: string | DirectusFile
  preview_video: string | DirectusFile
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
  pack_image: string | DirectusFile
  price: number | null
  released_at: string | null
  show_nfts: boolean
  slug: string
  status: DirectusStatus
  translations: number[] | DirectusPackTemplateTranslation[]
  type: PackType
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

// #endregion

// #region Mappers

export type GetFileURL = (file: string | DirectusFile) => string

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
    featuredPackTemplateId: homepage.featured_pack ?? undefined,
    upcomingPackTemplateIds: (homepage.upcoming_packs ?? []) as string[],
    notableCollectibleTemplateIds: (homepage.notable_collectibles ??
      []) as string[],
  }
}

export function toSetBase(set: DirectusSet): SetBase {
  const { id, slug, translations, nft_templates } = set

  invariant(translations.length > 0, `collection ${id} has no translations`)
  const translation = translations[0]
  invariant(
    translation !== undefined && typeof translation !== 'number',
    'no translation found'
  )
  const { name } = translation
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
  getFileURL: GetFileURL
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

  invariant(translations.length > 0, `collection ${id} has no translations`)
  const translation = translations[0]
  invariant(
    translation !== undefined && typeof translation !== 'number',
    'no translation found'
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
  getFileURL: GetFileURL
): SetWithCollection {
  const base = toSetBase(set)

  invariant(typeof set.collection !== 'string', 'collection must be an object')

  return {
    ...base,
    collection: toCollectionBase(set.collection, getFileURL),
  }
}

export function toCollectionWithSets(
  collection: DirectusCollection,
  getFileURL: GetFileURL
): CollectionWithSets {
  const base = toCollectionBase(collection, getFileURL)

  invariant(!isStringArray(collection.sets), 'sets must be an array of objects')

  return {
    ...base,
    sets: collection.sets.map((set) => toSetBase(set)),
  }
}

export function toCollectibleBase(
  template: DirectusCollectibleTemplate,
  getFileURL: GetFileURL
): CollectibleBase {
  const translation = template.translations[0]
  invariant(
    translation !== undefined && typeof translation !== 'number',
    'no translation found'
  )

  const rarity = template.rarity as DirectusRarity
  const [rarityTranslation] = rarity?.translations || []
  invariant(
    rarityTranslation === undefined || typeof rarityTranslation !== 'number',
    'expected rarity to include translations'
  )

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
  getFileURL: GetFileURL
): PackBase {
  const translation = template
    .translations[0] as DirectusPackTemplateTranslation
  invariant(
    translation !== undefined && typeof translation !== 'number',
    'no translation found'
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

export interface DirectusAdapterOptions {
  url: string
  accessToken: string
}

export default class DirectusAdapter {
  logger = logger.child({ context: this.constructor.name })
  http: Got

  constructor(private readonly options: DirectusAdapterOptions) {
    this.http = got.extend({
      prefixUrl: options.url,
      headers: {
        Authorization: `Bearer ${options.accessToken}`,
      },
    })
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
        status: DirectusStatus.Published,
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
        status: DirectusStatus.Published,
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
        status: DirectusStatus.Published,
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
        status: DirectusStatus.Published,
      },
      limit: -1,
      fields: ['*.*'],
    }

    return await this.findMany<DirectusSet>('sets', {
      ...defaultQuery,
      ...query,
    })
  }

  private getFileURL(fileOrId: string | DirectusFile) {
    const id = typeof fileOrId === 'string' ? fileOrId : fileOrId.id
    return new URL(`/assets/${id}`, this.options.url).href
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
      deep: {
        translations: {
          _filter: {
            languages_code: locale,
          },
        },
      },
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
        toPackBase(template, this.getFileURL.bind(this))
      ),
      total: response.meta.filter_count,
    }
  }

  async findPack(filter: ItemFilter = {}, locale = DEFAULT_LOCALE) {
    const response = await this.findPackTemplates({
      limit: 1,
      filter: {
        status: DirectusStatus.Published,
        ...filter,
      },
      deep: {
        translations: {
          _filter: {
            languages_code: locale,
          },
        },
      },
    })

    if (response.data.length === 0) return null
    const pack = response.data[0]
    return toPackBase(pack, this.getFileURL.bind(this))
  }

  async findAllCollectibles(
    locale = DEFAULT_LOCALE,
    filter: ItemFilter = {},
    limit = -1
  ) {
    const response = await this.findCollectibleTemplates({
      filter: {
        status: DirectusStatus.Published,
        ...filter,
      },
      limit,
      fields: [
        'id',
        'total_editions',
        'unique_code',
        'preview_image.*',
        'preview_video.*',
        'translations.*',
        'rarity.code',
        'rarity.color',
        'rarity.translations.*',
        'set.id',
        'set.collection.id',
        'collection',
      ],
      deep: {
        translations: {
          _filter: {
            languages_code: locale,
          },
        },
        rarity: {
          translations: {
            _filter: {
              languages_code: locale,
            },
          },
        },
      },
      filterCount: true,
    })

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collectibles: response.data.map((template) =>
        toCollectibleBase(template, this.getFileURL.bind(this))
      ),
      total: response.meta.filter_count,
    }
  }

  async findAllCollections(locale = DEFAULT_LOCALE) {
    const response = await this.findCollections({
      fields: [
        'collection_image',
        'id',
        'nft_templates',
        'reward_image',
        'slug',
        'translations.*',
        'sets.id',
        'sets.nft_templates',
        'sets.slug',
        'sets.translations.*',
      ],
      deep: {
        translations: {
          _filter: {
            languages_code: locale,
          },
        },
        sets: {
          translations: {
            _filter: {
              languages_code: locale,
            },
          },
        },
      },
      filterCount: true,
    })

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return {
      collections: response.data.map((c) =>
        toCollectionWithSets(c, this.getFileURL.bind(this))
      ),
      total: response.meta.filter_count,
    }
  }

  async findCollectionBySlug(slug: string, locale = DEFAULT_LOCALE) {
    const response = await this.findCollections({
      limit: 1,
      filter: {
        status: DirectusStatus.Published,
        slug,
      },
      fields: [
        'collection_image',
        'id',
        'nft_templates',
        'reward_image',
        'sets.id',
        'sets.nft_templates',
        'sets.slug',
        'sets.translations.*',
        'slug',
        'translations.*',
      ],
      deep: {
        translations: {
          _filter: {
            languages_code: locale,
          },
        },
        sets: {
          translations: {
            _filter: {
              languages_code: locale,
            },
          },
        },
      },
    })

    if (response.data.length === 0) return null
    const collection = response.data[0]
    return toCollectionWithSets(collection, this.getFileURL.bind(this))
  }

  async findSetBySlug(slug: string, locale = DEFAULT_LOCALE) {
    const response = await this.findSets({
      filter: {
        status: DirectusStatus.Published,
        slug,
      },
      fields: [
        'collection.collection_image',
        'collection.id',
        'collection.nft_templates',
        'collection.reward_image',
        'collection.slug',
        'collection.translations.*',
        'id',
        'nft_templates',
        'slug',
        'translations.*',
      ],
      limit: 1,
      deep: {
        translations: {
          _filter: {
            languages_code: locale,
          },
        },
        sets: {
          translations: {
            _filter: {
              languages_code: locale,
            },
          },
        },
      },
    })

    if (response.data.length === 0) return null
    const set = response.data[0]
    return toSetWithCollection(set, this.getFileURL.bind(this))
  }

  async findHomepage() {
    // Homepage is a singleton in the CMS, which makes this endpoint only return a single item.
    // Therefore we should avoid using the `findMany` method and instead act as if the result is
    // from a `findById` call.
    const response = await this.http.get('items/homepage', {
      searchParams: getParameters({
        fields: ['featured_pack', 'upcoming_packs', 'notable_collectibles'],
        deep: {
          featured_pack: {
            _filter: {
              status: DirectusStatus.Published,
            },
          },
          upcoming_packs: {
            _filter: {
              status: DirectusStatus.Published,
            },
          },
          notable_collectibles: {
            _filter: {
              status: DirectusStatus.Published,
            },
          },
        },
      }),
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const result: ItemByIdResponse<DirectusHomepage> = JSON.parse(
        response.body
      )
      return toHomepageBase(result.data)
    }

    return null
  }
}
