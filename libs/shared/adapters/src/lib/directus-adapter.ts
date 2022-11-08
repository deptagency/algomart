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
  DirectusTag,
} from '@algomart/schemas'
import { invariant } from '@algomart/shared/utils'
import { Directus, QueryMany } from '@directus/sdk'
import pino from 'pino'

// #region Directus Helpers

type DirectusTypeMap = {
  application: DirectusApplication
  collections: DirectusCollection
  frequently_asked_questions: DirectusFaqTemplate
  homepage: DirectusHomepage
  languages: DirectusLanguageTemplate
  nft_templates: DirectusCollectibleTemplate
  pack_templates: DirectusPackTemplate
  tags: DirectusTag
  sets: DirectusSet
  static_page: DirectusPage
}

// #endregion

export interface DirectusAdapterOptions {
  cmsUrl: string
  accessToken: string
}

export class DirectusAdapter {
  logger: pino.Logger<unknown>
  sdk: Directus<DirectusTypeMap>

  constructor(
    private readonly options: DirectusAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.sdk = new Directus<DirectusTypeMap>(options.cmsUrl)
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

  async ensureAuthenticated() {
    const isAuthenticated = await this.sdk.auth.static(this.options.accessToken)
    invariant(isAuthenticated, 'Invalid CMS access token')
  }

  async ensureFilePermission() {
    await this.ensureAuthenticated()

    const permissions = await this.sdk.permissions.readByQuery({
      filter: {
        collection: {
          _eq: 'directus_files',
        },
        fields: {
          _in: ['*'],
        },
        action: {
          _eq: 'read',
        },
      },
    })

    if (permissions.data.length === 0) {
      await this.sdk.permissions.createOne({
        collection: 'directus_files',
        action: 'read',
        fields: ['*'],
        role: null,
      })
    }
  }

  async findPackTemplates(query: QueryMany<DirectusPackTemplate> = {}) {
    await this.ensureAuthenticated()

    return await this.sdk.items('pack_templates').readByQuery({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: [
        '*',
        'pack_image.*',
        'pack_banner.*',
        'translations.*',
        'nft_templates.*',
        'nft_templates.translations.*',
        'nft_templates.asset_file.*',
        'nft_templates.preview_audio.*',
        'nft_templates.preview_image.*',
        'nft_templates.preview_video.*',
        'nft_templates.rarity.*',
        'nft_templates.rarity.translations.*',
        'nft_templates.tags.tags_id.id',
        'nft_templates.tags.tags_id.slug',
        'nft_templates.tags.tags_id.translations.*',
        'tags.tags_id.id',
        'tags.tags_id.slug',
        'tags.tags_id.translations.*',
      ],
      ...query,
    })
  }

  async findCollectibleTemplates(
    query: QueryMany<DirectusCollectibleTemplate> = {}
  ) {
    await this.ensureAuthenticated()

    return await this.sdk.items('nft_templates').readByQuery({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: [
        'id',
        'asset_file.*',
        'collection.*',
        'collection.collection_image.*',
        'collection.translations.*',
        'pack_template.id',
        'preview_audio.*',
        'preview_image.*',
        'preview_video.*',
        'rarity.code',
        'rarity.color',
        'rarity.translations.*',
        'set.*',
        'set.collection.*',
        'set.collection.collection_image.*',
        'set.collection.translations.*',
        'total_editions',
        'translations.*',
        'unique_code',
        'tags.tags_id.id',
        'tags.tags_id.slug',
        'tags.tags_id.translations.*',
      ],
      ...query,
    })
  }

  async findTags(query: QueryMany<DirectusTag> = {}) {
    await this.ensureAuthenticated()

    return await this.sdk.items('tags').readByQuery({
      filter: {},
      limit: -1,
      fields: ['id', 'slug', 'translations.*'],
      ...query,
    })
  }

  async findCollections(query: QueryMany<DirectusCollection> = {}) {
    await this.ensureAuthenticated()

    return await this.sdk.items('collections').readByQuery({
      filter: {
        status: {
          _eq: DirectusStatus.Published,
        },
      },
      limit: -1,
      fields: [
        'collection_image.*',
        'id',
        'nft_templates.*',
        'nft_templates.translations.*',
        'reward_image.*',
        'slug',
        'translations.*',
        'sets.id',
        'sets.nft_templates',
        'sets.slug',
        'sets.translations.*',
      ],
      ...query,
    })
  }

  async findLanguages(query: QueryMany<DirectusLanguageTemplate> = {}) {
    await this.ensureAuthenticated()

    return await this.sdk.items('languages').readByQuery({
      limit: -1,
      fields: ['code', 'label', 'sort'],
      ...query,
    })
  }

  async findSets(query: QueryMany<DirectusSet> = {}) {
    await this.ensureAuthenticated()

    return await this.sdk.items('sets').readByQuery({
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
        'nft_templates.translations.*',
      ],
      ...query,
    })
  }

  async findPages(query: QueryMany<DirectusPage> = {}) {
    await this.ensureAuthenticated()

    return await this.sdk.items('static_page').readByQuery({
      limit: -1,
      fields: ['id', 'slug', 'hero_banner.*', 'translations.*'],
      ...query,
    })
  }

  async findFaqs(query: QueryMany<DirectusFaqTemplate> = {}) {
    await this.ensureAuthenticated()

    return this.sdk.items('frequently_asked_questions').readByQuery({
      filter: {},
      limit: -1,
      fields: ['id', 'key', 'sort', 'translations.*'],
      ...query,
    })
  }

  async findHomepage() {
    await this.ensureAuthenticated()

    const response = await this.sdk.items('homepage').readByQuery({
      fields: [
        'id',

        'hero_banner.*',
        'translations.*',

        'hero_pack.*',
        'hero_pack.pack_banner.*',
        'hero_pack.pack_image.*',
        'hero_pack.translations.*',
        'hero_pack.tags.tags_id.id',
        'hero_pack.tags.tags_id.slug',
        'hero_pack.tags.tags_id.translations.*',
        'hero_pack.nft_templates.*',
        'hero_pack.nft_templates.asset_file.*',
        'hero_pack.nft_templates.translations.*',
        'hero_pack.nft_templates.preview_audio.*',
        'hero_pack.nft_templates.preview_image.*',
        'hero_pack.nft_templates.preview_video.*',
        'hero_pack.nft_templates.rarity.*',
        'hero_pack.nft_templates.rarity.translations.*',
        'hero_pack.nft_templates.tags.tags_id.id',
        'hero_pack.nft_templates.tags.tags_id.slug',
        'hero_pack.nft_templates.tags.tags_id.translations.*',

        'featured_faqs.*',
        'featured_faqs.translations.*',

        'featured_packs.*',
        'featured_packs.pack_image.*',
        'featured_packs.translations.*',
        'featured_packs.tags.tags_id.id',
        'featured_packs.tags.tags_id.slug',
        'featured_packs.tags.tags_id.translations.*',
        'featured_packs.nft_templates.*',
        'featured_packs.nft_templates.asset_file.*',
        'featured_packs.nft_templates.translations.*',
        'featured_packs.nft_templates.preview_audio.*',
        'featured_packs.nft_templates.preview_image.*',
        'featured_packs.nft_templates.preview_video.*',
        'featured_packs.nft_templates.rarity.*',
        'featured_packs.nft_templates.rarity.translations.*',
        'featured_packs.nft_templates.tags.tags_id.id',
        'featured_packs.nft_templates.tags.tags_id.slug',
        'featured_packs.nft_templates.tags.tags_id.translations.*',

        'featured_nfts.*',
        'featured_nfts.asset_file.*',
        'featured_nfts.translations.*',
        'featured_nfts.preview_audio.*',
        'featured_nfts.preview_image.*',
        'featured_nfts.preview_video.*',
        'featured_nfts.rarity.*',
        'featured_nfts.rarity.translations.*',
        'featured_nfts.tags.tags_id.id',
        'featured_nfts.tags.tags_id.slug',
        'featured_nfts.tags.tags_id.translations.*',

        'featured_rarities.*',
        'featured_rarities.translations.*',
        'featured_rarities.image.*',
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
    })

    // DirectusHomepage is a singleton, so we override the many-response
    // and force cast the type to a single DirectusHomepage
    return response.data as unknown as DirectusHomepage
  }

  async findApplication() {
    await this.ensureAuthenticated()

    const response = await this.sdk.items('application').readByQuery({
      fields: [
        'id',
        'currency',
        'countries.*',
        'countries.countries_id.*',
        'countries.countries_id.translations.*',
      ],
      deep: {
        countries: {
          _limit: -1,
        },
      },
    })

    // DirectusApplication is a singleton, so we override the many-response
    // and force cast the type to a single DirectusApplication
    return response.data as unknown as DirectusApplication
  }
}
