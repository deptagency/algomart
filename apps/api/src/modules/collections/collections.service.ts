import { DEFAULT_LOCALE } from '@algomart/schemas'
import { logger } from '@api/configuration/logger'
import DirectusAdapter from '@api/lib/directus-adapter'

export default class CollectionsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: DirectusAdapter) {}

  async getAllCollections(locale = DEFAULT_LOCALE) {
    return await this.cms.findAllCollections(locale)
  }

  async getCollectionBySlug(slug: string, locale = DEFAULT_LOCALE) {
    return await this.cms.findCollectionBySlug(slug, locale)
  }
}
