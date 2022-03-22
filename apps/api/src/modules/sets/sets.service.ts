import { DEFAULT_LANG } from '@algomart/schemas'
import { logger } from '@api/configuration/logger'
import CMSCacheAdapter from '@api/lib/cms-cache-adapter'

export default class SetsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(private readonly cms: CMSCacheAdapter) {}

  async getBySlug(slug: string, language = DEFAULT_LANG) {
    return await this.cms.findSetBySlug(slug, language)
  }
}
