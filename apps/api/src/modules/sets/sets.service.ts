import { DEFAULT_LOCALE } from '@algomart/schemas'

import DirectusAdapter from '@/lib/directus-adapter'
import { logger } from '@/utils/logger'

export default class SetsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: DirectusAdapter) {}

  async getBySlug(slug: string, locale = DEFAULT_LOCALE) {
    return await this.cms.findSetBySlug(slug, locale)
  }
}
