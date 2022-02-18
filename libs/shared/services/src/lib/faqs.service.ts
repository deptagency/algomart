import pino from 'pino'
import { DEFAULT_LOCALE } from '@algomart/schemas'
import { DirectusAdapter } from '@algomart/shared/adapters'

export default class FaqsService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly cms: DirectusAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getFaqs(locale = DEFAULT_LOCALE) {
    const faqs = await this.cms.getFaqs(locale)
    return {
      faqs,
    }
  }
}
