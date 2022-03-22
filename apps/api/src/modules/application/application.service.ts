import { Countries, DEFAULT_LANG } from '@algomart/schemas'
import { invariant } from '@algomart/shared/utils'
import { logger } from '@api/configuration/logger'
import CMSCacheAdapter from '@api/lib/cms-cache-adapter'

export default class ApplicationService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: CMSCacheAdapter) {}

  async getCountries(language = DEFAULT_LANG): Promise<Countries> {
    // Find application details and compile IDs of supported countries
    const application = await this.cms.findApplication()
    invariant(application?.countries?.length > 0, 'No countries found')
    const countryCodes = application.countries.map(
      ({ countries_code }) => countries_code
    )

    // Search for countries
    // TODO: Make CMS cache adapter function
    const countries = await this.cms.findAllCountries(language)
    return countries.filter((country) =>
      countryCodes.find(({ code }) => code === country.code)
    )
  }
}
