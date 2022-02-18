import pino from 'pino'
import { DEFAULT_LOCALE } from '@algomart/schemas'

import { DirectusAdapter } from '@algomart/shared/adapters'

export default class CollectionsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: DirectusAdapter,
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
