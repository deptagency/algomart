import pino from 'pino'
import { Countries, DEFAULT_LANG } from '@algomart/schemas'
import { invariant } from '@algomart/shared/utils'
import { CMSCacheAdapter } from '@algomart/shared/adapters'

export class ApplicationService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

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
