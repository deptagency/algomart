import { DEFAULT_LANG } from '@algomart/schemas'
import pino from 'pino'

import { CMSCacheService } from './cms-cache.service'

export class SetsService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly cms: CMSCacheService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getBySlug(slug: string, language = DEFAULT_LANG) {
    return await this.cms.findSetBySlug(slug, language)
  }
}
