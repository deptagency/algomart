import pino from 'pino'
import {
  DEFAULT_LOCALE,
  DirectusCollectibleTemplate,
  DirectusCollection,
  DirectusFaqTemplate,
  DirectusHomepage,
  DirectusLanguageTemplate,
  DirectusPackTemplate,
  DirectusPage,
  DirectusSet,
  DirectusStatus,
} from '@algomart/schemas'
import got, { Got } from 'got'
import { URLSearchParams } from 'node:url'

import { invariant } from '@algomart/shared/utils'

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

  private async findPages(query: ItemQuery<DirectusPage> = {}) {
    const defaultQuery: ItemQuery<DirectusPage> = {
      filter: {},
      limit: -1,
      fields: ['*.*'],
    }

    return await this.findMany<DirectusPage>('pages', {
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

    return response.data
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

    return response.data
  }

  async findAllCollections() {
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

    return response.data
  }

  async findAllSets() {
    const response = await this.findSets({
      fields: [
        'id',
        'status',
        'sort',
        'slug',
        'collection.*',
        'translations.*',
        'nft_templates.*',
      ],
      filterCount: true,
    })

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return response.data
  }

  async findAllPages() {
    const response = await this.findPages({
      fields: ['id', 'slug', 'translations.*'],
      filterCount: true,
    })

    invariant(
      typeof response.meta?.filter_count === 'number',
      'filter_count missing from response'
    )

    return response.data
  }

  async getFaqs() {
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

    return response.data
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
        // TODO: update these to return the full objects rather than just the ids
        fields: [
          'id',
          'hero_banner',
          'hero_pack',
          'featured_packs',
          'featured_nfts',
          'translations.*',

          // 'featured_pack.*',
          // 'featured_pack.pack_image.*',
          // 'featured_pack.translations.*',
          // 'featured_pack.nft_templates.*',
          // 'featured_pack.nft_templates.asset_file.*',
          // 'featured_pack.nft_templates.translations.*',
          // 'featured_pack.nft_templates.preview_audio.*',
          // 'featured_pack.nft_templates.preview_image.*',
          // 'featured_pack.nft_templates.preview_video.*',

          // 'upcoming_packs.*',
          // 'upcoming_packs.pack_image.*',
          // 'upcoming_packs.translations.*',
          // 'upcoming_packs.nft_templates.*',
          // 'featured_pack.nft_templates.asset_file.*',
          // 'featured_pack.nft_templates.translations.*',
          // 'featured_pack.nft_templates.preview_audio.*',
          // 'featured_pack.nft_templates.preview_image.*',
          // 'featured_pack.nft_templates.preview_video.*',

          // 'notable_collectibles.*',
          // 'notable_collectibles.asset_file.*',
          // 'notable_collectibles.translations.*',
          // 'notable_collectibles.preview_audio.*',
          // 'notable_collectibles.preview_image.*',
          // 'notable_collectibles.preview_video.*',
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

  async getLanguages() {
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

    return response.data
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
