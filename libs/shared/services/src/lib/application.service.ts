import { Country, DEFAULT_LANG } from '@algomart/schemas'
import { invariant } from '@algomart/shared/utils'
import pino from 'pino'

import { CMSCacheService } from './cms-cache.service'

export class ApplicationService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly cms: CMSCacheService,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async getCountries(language = DEFAULT_LANG): Promise<Country[]> {
    // Find application details and compile IDs of supported countries
    const countries = await this.cms.findAllCountries(language)

    invariant(countries.length > 0, 'No countries found')

    return countries
  }
}
