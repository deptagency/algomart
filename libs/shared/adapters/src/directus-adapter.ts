import pino from 'pino'
import {
  DirectusApplication,
  DirectusCollectibleTemplate,
  DirectusCollection,
  DirectusFaqTemplate,
  DirectusHomepage,
  DirectusLanguageTemplate,
  DirectusPackTemplate,
  DirectusPage,
  DirectusSet,
  DirectusStatus,
  DirectusWebhook,
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

import got, { Got } from 'got'
import { URLSearchParams } from 'node:url'

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
      fields: [
        '*',
        'pack_image.*',
        'translations.*',
        'nft_templates.*',
        'nft_templates.translations.*',
        'nft_templates.asset_file.*',
        'nft_templates.translations.*',
        'nft_templates.preview_audio.*',
        'nft_templates.preview_image.*',
        'nft_templates.preview_video.*',
        'nft_templates.rarity.*',
        'nft_templates.rarity.translations.*',
      ],
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
    }

    return await this.findMany<DirectusCollection>('collections', {
      ...defaultQuery,
      ...query,
    })
  }

  private async findLanguages(query: ItemQuery<DirectusLanguageTemplate> = {}) {
    const defaultQuery: ItemQuery<DirectusLanguageTemplate> = {
      limit: -1,
      fields: ['code', 'translations.*'],
    }

    return await this.findMany<DirectusLanguageTemplate>('languages', {
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
      fields: [
        'id',
        'status',
        'sort',
        'slug',
        'collection.*',
        'collection.translations.*',
        'translations.*',
        'nft_templates.*',
      ],
    }

    return await this.findMany<DirectusSet>('sets', {
      ...defaultQuery,
      ...query,
    })
  }

  private async findPages(query: ItemQuery<DirectusPage> = {}) {
    const defaultQuery: ItemQuery<DirectusPage> = {
      limit: -1,
      fields: ['id', 'slug', 'hero_banner.*', 'translations.*'],
    }

    return await this.findMany<DirectusPage>('static_page', {
      ...defaultQuery,
      ...query,
    })
  }

  private async findFaqs(query: ItemQuery<DirectusFaqTemplate> = {}) {
    const defaultQuery: ItemQuery<DirectusFaqTemplate> = {
      filter: {},
      limit: -1,
      fields: ['id', 'translations.*'],
    }

    return await this.findMany<DirectusFaqTemplate>('faqs', {
      ...defaultQuery,
      ...query,
    })
  }

  // #region directus sync methods
  private async syncCollection(collectionId) {
    const response = await this.findCollections({
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
      await CMSCacheCollectionModel.upsert(
        response.data[0] as unknown as DirectusCollection
      )
    }
  }

  private async syncCollectibleTemplate(collectibleId) {
    const response = await this.findCollectibleTemplates({
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
      await CMSCacheCollectibleTemplateModel.upsert(
        response.data[0] as unknown as DirectusCollectibleTemplate
      )
    }
  }

  private async syncLanguage(languageCode) {
    const response = await this.findLanguages({
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

  private async syncPackTemplate(packId) {
    const response = await this.findPackTemplates({
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
      await CMSCachePackTemplateModel.upsert(
        response.data[0] as unknown as DirectusPackTemplate
      )
    }
  }

  private async syncCountries() {
    await this.syncApplication()
  }

  private async syncRarities() {
    await this.syncHomePage()

    const collectibleTemplates = await this.findCollectibleTemplates()
    for (const collectibleTemplate in collectibleTemplates) {
      await CMSCacheCollectibleTemplateModel.upsert(
        collectibleTemplate as unknown as DirectusCollectibleTemplate
      )
    }
  }

  private async syncSet(setId) {
    const response = await this.findSets({
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
      await CMSCacheSetModel.upsert(response.data[0] as unknown as DirectusSet)
    }
  }

  private async syncPage(pageId) {
    const response = await this.findPages({
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

  private async syncFaq(faqId) {
    const response = await this.findFaqs({
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

  // #endregion

  async syncAllLanguages() {
    const response = await this.findLanguages()

    for (const language of response.data) {
      await CMSCacheLanguageModel.upsert(language)
    }
  }

  async syncAllPackTemplates() {
    const response = await this.findPackTemplates({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const packTemplate of response.data) {
      await CMSCachePackTemplateModel.upsert(packTemplate)
    }
  }

  async syncAllCollectibleTemplates() {
    const response = await this.findCollectibleTemplates({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const collectibleTemplate of response.data) {
      await CMSCacheCollectibleTemplateModel.upsert(collectibleTemplate)
    }
  }

  async syncAllCollections() {
    const response = await this.findCollections({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const collection of response.data) {
      await CMSCacheCollectionModel.upsert(collection)
    }
  }

  async syncAllSets() {
    const response = await this.findSets({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const set of response.data) {
      await CMSCacheSetModel.upsert(set)
    }
  }

  async syncAllPages() {
    const response = await this.findPages({
      filter: {},
    })

    for (const page of response.data) {
      await CMSCachePageModel.upsert(page)
    }
  }

  async syncAllFaqs() {
    const response = await this.findFaqs({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
    })

    for (const faq of response.data) {
      await CMSCacheFaqModel.upsert(faq)
    }
  }

  async syncHomePage() {
    const response = await this.http.get('items/homepage', {
      searchParams: getParameters({
        fields: [
          'id',

          'hero_banner.*',
          'translations.*',

          'hero_pack.*',
          'hero_pack.pack_image.*',
          'hero_pack.translations.*',
          'hero_pack.nft_templates.*',
          'hero_pack.nft_templates.asset_file.*',
          'hero_pack.nft_templates.translations.*',
          'hero_pack.nft_templates.preview_audio.*',
          'hero_pack.nft_templates.preview_image.*',
          'hero_pack.nft_templates.preview_video.*',
          'hero_pack.nft_templates.rarity.*',
          'hero_pack.nft_templates.rarity.translations.*',

          'featured_packs.*',
          'featured_packs.pack_image.*',
          'featured_packs.translations.*',
          'featured_packs.nft_templates.*',
          'featured_packs.nft_templates.asset_file.*',
          'featured_packs.nft_templates.translations.*',
          'featured_packs.nft_templates.preview_audio.*',
          'featured_packs.nft_templates.preview_image.*',
          'featured_packs.nft_templates.preview_video.*',
          'featured_packs.nft_templates.rarity.*',
          'featured_packs.nft_templates.rarity.translations.*',

          'featured_nfts.*',
          'featured_nfts.*',
          'featured_nfts.asset_file.*',
          'featured_nfts.translations.*',
          'featured_nfts.preview_audio.*',
          'featured_nfts.preview_image.*',
          'featured_nfts.preview_video.*',
          'featured_nfts.rarity.*',
          'featured_nfts.rarity.translations.*',
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
      const homepage = JSON.parse(response.body).data as DirectusHomepage

      await CMSCacheHomepageModel.upsert(
        homepage as unknown as DirectusHomepage
      )
    }

    return null
  }

  async syncApplication() {
    const response = await this.http.get('items/application', {
      searchParams: getParameters({
        fields: [
          'id',
          'currency',
          'countries.*',
          'countries.countries_code.*',
          'countries.countries_code.translations.*',
        ],
      }),
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      const application = JSON.parse(response.body).data as DirectusApplication

      await CMSCacheApplicationModel.upsert(
        application as unknown as DirectusApplication
      )
    }

    return null
  }

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
        return await this.syncCollectibleTemplate(webhook.key)
      case 'pack_templates':
        return await this.syncPackTemplate(webhook.key)
      case 'rarities':
        // nothing to do for new rariteies. inserts are handled with collectible and homepage collection updates
        return null
      case 'sets':
        return await this.syncSet(webhook.key)
      case 'faqs':
        return await this.syncFaq(webhook.key)
      case 'pages':
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
        return await this.syncCollection(webhook.keys[0])
      case 'countries':
        return await this.syncCountries()
      case 'homepage':
        return await this.syncHomePage()
      case 'languages':
        return await this.syncLanguage(webhook.keys[0])
      case 'nft_templates':
        return await this.syncCollectibleTemplate(webhook.keys[0])
      case 'pack_templates':
        return await this.syncPackTemplate(webhook.keys[0])
      case 'rarities':
        return await this.syncRarities()
      case 'sets':
        return await this.syncSet(webhook.keys[0])
      case 'faqs':
        return await this.syncFaq(webhook.keys[0])
      case 'pages':
        return await this.syncPage(webhook.keys[0])
      default:
        throw new Error(
          `unhandled directus webhook items.update event: ${webhook.collection}`
        )
    }
  }

  private async processWebhookDelete(webhook: DirectusWebhook) {
    switch (webhook.collection) {
      // TODO: handle delete operations
      default:
        throw new Error(
          `unhandled directus webhook items.delete event: ${webhook.collection}`
        )
    }
  }

  // #endregion
}
