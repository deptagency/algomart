import { DEFAULT_LOCALE } from '@algomart/schemas'

import DirectusAdapter from '@/lib/directus-adapter'
import { logger } from '@/utils/logger'

export default class FaqsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: DirectusAdapter) {}

  async getFaqs(locale = DEFAULT_LOCALE) {
    const faqs = await this.cms.getFaqs(locale)
    return {
      faqs,
    }
  }
}
