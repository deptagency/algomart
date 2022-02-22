import { Countries, DEFAULT_LOCALE } from '@algomart/schemas'

import DirectusAdapter from '@/lib/directus-adapter'
import { invariant } from '@/utils/invariant'
import { logger } from '@/utils/logger'

export default class ApplicationService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: DirectusAdapter) {}

  async getCountries(locale = DEFAULT_LOCALE): Promise<Countries> {
    // Find application details and compile IDs of supported countries
    const application = await this.cms.findApplication()
    invariant(application?.countries?.length > 0, 'No countries found')
    const countryCodes = application.countries.map(
      ({ countries_code }) => countries_code
    )

    // Search for countries
    const countries = await this.cms.findPublishedCountries(
      {
        code: { _in: countryCodes },
      },
      locale
    )
    return countries
  }
}
