import { DEFAULT_LOCALE } from '@algomart/schemas'
import { logger } from '@api/configuration/logger'
import CMSCacheAdapter from '@api/lib/cms-cache-adapter'

export default class CollectionsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: CMSCacheAdapter) {}

  async getAllCollections(locale = DEFAULT_LOCALE) {
    return await this.cms.findAllCollections(locale)
  }

  async getCollectionBySlug(slug: string, locale = DEFAULT_LOCALE) {
    return await this.cms.findCollectionBySlug(slug, locale)
  }
}
