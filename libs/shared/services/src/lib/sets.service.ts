import pino from 'pino'
import { DEFAULT_LOCALE } from '@algomart/schemas'

import { CMSCacheAdapter } from '@algomart/shared/adapters'

export default class SetsService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getBySlug(slug: string, locale = DEFAULT_LOCALE) {
    return await this.cms.findSetBySlug(slug, locale)
  }
}
