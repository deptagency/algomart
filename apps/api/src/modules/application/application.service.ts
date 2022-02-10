import { Countries, DEFAULT_LOCALE } from '@algomart/schemas'

import DirectusAdapter from '@/lib/directus-adapter'
import { logger } from '@/utils/logger'

export default class ApplicationService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: DirectusAdapter) {}

  async getCountries(locale = DEFAULT_LOCALE): Promise<Countries> {
    // @TODO: Get countries
    const application = await this.cms.findCountries(locale)
    return application
  }
}
