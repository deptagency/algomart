import pino from 'pino'
import {
  DirectusApplication,
  DirectusCollectibleTemplate,
  DirectusCollection,
  DirectusHomepage,
  DirectusPackTemplate,
  DirectusSet,
  DirectusStatus,
  DirectusWebhook,
} from '@algomart/schemas'
import { HttpTransport } from '@algomart/shared/utils'
import {
  CMSCacheCollectionModel,
  CMSCacheCollectibleTemplateModel,
  CMSCachePackTemplateModel,
  CMSCacheSetModel,
  CMSCacheHomepageModel,
  CMSCacheApplicationModel,
} from '@algomart/shared/models'

// #region Directus Helpers

interface ItemsResponse<T> {
  data: T[]
  meta?: {
    filter_count?: number
    total_count?: number
  }
}

interface ItemFilter {
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

interface ItemQuery<TItem> {
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
  const parameters = {}

  if (query?.fields) {
    Object.assign(parameters, { fields: query.fields.join(',') })
  }

  if (query?.search) {
    Object.assign(parameters, { search: query.search })
  }

  if (query?.sort) {
    Object.assign(parameters, { sort: query.sort.join(',') })
  }

  if (query?.limit) {
    Object.assign(parameters, { limit: query.limit })
  }

  if (query?.offset) {
    Object.assign(parameters, { offset: query.offset })
  }

  if (query?.page) {
    Object.assign(parameters, { page: query.page })
  }

  if (query?.filter) {
    Object.assign(parameters, { filter: JSON.stringify(query.filter) })
  }

  if (query?.deep) {
    Object.assign(parameters, { deep: JSON.stringify(query.deep) })
  }

  if (query?.totalCount || query?.filterCount) {
    Object.assign(parameters, {
      meta:
        query.totalCount && query.filterCount
          ? '*'
          : query.totalCount
          ? 'total_count'
          : 'filter_count',
    })
  }

  return parameters
}

// #endregion

export interface DirectusAdapterOptions {
  cmsUrl: string
  gcpCdnUrl?: string
  accessToken: string
}

export class DirectusAdapter {
  logger: pino.Logger<unknown>
  http: HttpTransport

  constructor(
    private readonly options: DirectusAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.http = new HttpTransport(options.cmsUrl, undefined, {
      Authorization: `Bearer ${options.accessToken}`,
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
      .get<{
        data: Array<{
          id: number
          role: string | null
          collection: string
          action: 'create' | 'read' | 'update' | 'delete'
          fields: string[]
        }>
      }>('permissions', {
        params: {
          fields: 'id,role,collection,action,fields',
          'filter[collection][_eq]': 'directus_files',
          'filter[fields][_in]': '*',
          'filter[action][_eq]': 'read',
        },
      })
      .then((response) => response.data)

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
    const response = await this.http.get<ItemsResponse<TItem>>(
      `items/${collection}`,
      {
        params: getParameters(query),
      }
    )

    return response.data
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

  // #endregion

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

  async syncHomePage() {
    const response = await this.http.get<{ data: DirectusHomepage }>(
      'items/homepage',
      {
        params: getParameters({
          fields: [
            'id',

            'translations.*',

            'upcoming_packs.*',
            'upcoming_packs.pack_image.*',
            'upcoming_packs.translations.*',
            'upcoming_packs.nft_templates.*',
            'upcoming_packs.nft_templates.asset_file.*',
            'upcoming_packs.nft_templates.translations.*',
            'upcoming_packs.nft_templates.preview_audio.*',
            'upcoming_packs.nft_templates.preview_image.*',
            'upcoming_packs.nft_templates.preview_video.*',
            'upcoming_packs.nft_templates.rarity.*',
            'upcoming_packs.nft_templates.rarity.translations.*',

            'featured_pack.*',
            'featured_pack.pack_image.*',
            'featured_pack.translations.*',
            'featured_pack.nft_templates.*',
            'featured_pack.nft_templates.asset_file.*',
            'featured_pack.nft_templates.translations.*',
            'featured_pack.nft_templates.preview_audio.*',
            'featured_pack.nft_templates.preview_image.*',
            'featured_pack.nft_templates.preview_video.*',
            'featured_pack.nft_templates.rarity.*',
            'featured_pack.nft_templates.rarity.translations.*',
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
      }
    )

    const homepage = response.data.data

    await CMSCacheHomepageModel.upsert(homepage as DirectusHomepage)

    return null
  }

  async syncApplication() {
    const response = await this.http.get<{ data: DirectusApplication }>(
      'items/application',
      {
        params: getParameters({
          fields: [
            'id',
            'currency',
            'countries.*',
            'countries.countries_code.*',
            'countries.countries_code.translations.*',
          ],
        }),
      }
    )
    const application = response.data.data
    await CMSCacheApplicationModel.upsert(application as DirectusApplication)

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
      case 'nft_templates':
        return await this.syncCollectibleTemplate(webhook.key)
      case 'pack_templates':
        return await this.syncPackTemplate(webhook.key)
      case 'rarities':
        // nothing to do for new rariteies. inserts are handled with collectible and homepage collection updates
        return null
      case 'sets':
        return await this.syncSet(webhook.key)
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
      case 'nft_templates':
        return await this.syncCollectibleTemplate(webhook.keys[0])
      case 'pack_templates':
        return await this.syncPackTemplate(webhook.keys[0])
      case 'rarities':
        return await this.syncRarities()
      case 'sets':
        return await this.syncSet(webhook.keys[0])
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
