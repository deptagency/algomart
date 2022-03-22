import pino from 'pino'
import { DEFAULT_LOCALE } from '@algomart/schemas'
import { CMSCacheAdapter } from '@algomart/shared/adapters'

export class CollectionsService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly cms: CMSCacheAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getAllCollections(locale = DEFAULT_LOCALE) {
    return await this.cms.findAllCollections(locale)
  }

  async getCollectionBySlug(slug: string, locale = DEFAULT_LOCALE) {
    return await this.cms.findCollectionBySlug(slug, locale)
  }
}
