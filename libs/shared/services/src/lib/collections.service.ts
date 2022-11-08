import { DEFAULT_LANG } from '@algomart/schemas'
import pino from 'pino'

import { CMSCacheService } from './cms-cache.service'

export class CollectionsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getAllCollections(language = DEFAULT_LANG) {
    return await this.cms.findAllCollections(language)
  }

  async getCollectionBySlug(slug: string, language = DEFAULT_LANG) {
    return await this.cms.findCollectionBySlug(slug, language)
  }
}
