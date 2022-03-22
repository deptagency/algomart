import { DEFAULT_LANG } from '@algomart/schemas'
import { logger } from '@api/configuration/logger'
import CMSCacheAdapter from '@api/lib/cms-cache-adapter'

export default class CollectionsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: CMSCacheAdapter) {}

  async getAllCollections(language = DEFAULT_LANG) {
    return await this.cms.findAllCollections(language)
  }

  async getCollectionBySlug(slug: string, language = DEFAULT_LANG) {
    return await this.cms.findCollectionBySlug(slug, language)
  }
}
