import { DEFAULT_LANG } from '@algomart/schemas'
import pino from 'pino'

import { CMSCacheService } from './cms-cache.service'

export class FaqsService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly cms: CMSCacheService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getFaqs(language = DEFAULT_LANG) {
    const faqs = await this.cms.getFaqs(language)
    return {
      faqs,
    }
  }
}
