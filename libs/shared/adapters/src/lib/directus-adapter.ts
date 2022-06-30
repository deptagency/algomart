import { Directus, ManyItems, PermissionItem, QueryMany } from '@directus/sdk'
import pino from 'pino'
import {
  DirectusApplication,
  DirectusCollectibleTemplate,
  DirectusCollection,
  DirectusHomepage,
  DirectusLanguageTemplate,
  DirectusPackTemplate,
  DirectusSet,
  DirectusStatus,
  DirectusWebhook,
} from '@algomart/schemas'
import {
  CMSCacheCollectionModel,
  CMSCacheCollectibleTemplateModel,
  CMSCacheLanguageModel,
  CMSCachePackTemplateModel,
  CMSCacheSetModel,
  CMSCacheHomepageModel,
  CMSCacheApplicationModel,
} from '@algomart/shared/models'

// #region Directus Helpers

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

// #endregion

export interface DirectusAdapterOptions {
  cmsUrl: string
  gcpCdnUrl?: string
  accessToken: string
}

type AllCollections = {
  application: DirectusApplication
  nft_templates: DirectusCollectibleTemplate
  collections: DirectusCollection
  homepage: DirectusHomepage
  languages: DirectusLanguageTemplate
  pack_templates: DirectusPackTemplate
  sets: DirectusSet
}

export class DirectusAdapter {
  logger: pino.Logger<unknown>
  directus: Directus<AllCollections>

  constructor(
    private readonly options: DirectusAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.directus = new Directus<AllCollections>(this.options.cmsUrl, {
      auth: { staticToken: this.options.accessToken },
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
    const permissions = (
      await this.directus.items('directus_permissions').readByQuery({
        filter: {
          collection: {
            _eq: 'directus_files',
          },
        },
      })
    ).data[0] as PermissionItem

    if (permissions === undefined) {
      await this.directus.items('directus_permissions').createOne({
        role: null,
        collection: 'directus_files',
        action: 'read',
        presets: null,
        fields: ['*'],
      })
    } else {
      await this.directus
        .items('directus_permissions')
        .updateOne(permissions.id, {
          role: null,
          collection: 'directus_files',
          action: 'read',
          presets: null,
          fields: ['*'],
        })
    }
  }

  private async findMany<TItem>(
    collection: string,
    query: QueryMany<TItem> = {}
  ): Promise<ManyItems<TItem>> {
    return await this.directus.items(collection).readByQuery(<TItem>query)
  }

  private async findPackTemplates(query: QueryMany<DirectusPackTemplate> = {}) {
    const defaultQuery: QueryMany<DirectusPackTemplate> = {
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
    query: QueryMany<DirectusCollectibleTemplate> = {}
  ) {
    const defaultQuery: QueryMany<DirectusCollectibleTemplate> = {
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

  private async findCollections(query: QueryMany<DirectusCollection> = {}) {
    const defaultQuery: QueryMany<DirectusCollection> = {
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

  private async findLanguages(query: QueryMany<DirectusLanguageTemplate> = {}) {
    const defaultQuery: QueryMany<DirectusLanguageTemplate> = {
      limit: -1,
      fields: ['code', 'name', 'sort'],
    }

    return await this.findMany<DirectusLanguageTemplate>('languages', {
      ...defaultQuery,
      ...query,
    })
  }

  private async findSets(query: QueryMany<DirectusSet> = {}) {
    const defaultQuery: QueryMany<DirectusSet> = {
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
        response.data[0] as DirectusCollection
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
        response.data[0] as DirectusCollectibleTemplate
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
        response.data[0] as DirectusLanguageTemplate
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
        response.data[0] as DirectusPackTemplate
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
      await CMSCacheSetModel.upsert(response.data[0] as DirectusSet)
    }
  }

  // #endregion

  async syncAllLanguages() {
    const response = await this.findLanguages()
    for (const language of response.data) {
      await CMSCacheLanguageModel.upsert(language as DirectusLanguageTemplate)
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
      await CMSCachePackTemplateModel.upsert(
        packTemplate as DirectusPackTemplate
      )
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
      await CMSCacheCollectibleTemplateModel.upsert(
        collectibleTemplate as DirectusCollectibleTemplate
      )
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
      await CMSCacheCollectionModel.upsert(collection as DirectusCollection)
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
      await CMSCacheSetModel.upsert(set as DirectusSet)
    }
  }

  async syncHomePage() {
    const response = await this.directus.items('homepage').readByQuery({
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
        featured_pack: {
          _filter: {
            status: {
              _eq: DirectusStatus.Published,
            },
          },
        },
        upcoming_packs: {
          _filter: {
            status: {
              _eq: DirectusStatus.Published,
            },
          },
        },
        notable_collectibles: {
          _filter: {
            status: {
              _eq: DirectusStatus.Published,
            },
          },
        },
      },
    })
    const homepage = response.data as unknown as DirectusHomepage
    // If the homepage has not yet been saved, it won't have an id set.
    if (homepage.id) {
      await CMSCacheHomepageModel.upsert(homepage)
    }
    return null
  }

  async syncApplication() {
    const response = await this.directus.items('application').readByQuery({
      fields: [
        'id',
        'currency',
        'countries.*',
        'countries.countries_code.*',
        'countries.countries_code.translations.*',
      ],
    })
    const application = response.data as unknown as DirectusApplication
    await CMSCacheApplicationModel.upsert(application)
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
