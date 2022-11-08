import { DEFAULT_LOCALE, DirectusPage } from '@algomart/schemas'
import { userInvariant } from '@algomart/shared/utils'

import { CMSCacheService } from './cms-cache.service'

export class DirectusPageService {
  constructor(private readonly cms: CMSCacheService) {}

  async getPage(slug: string, locale = DEFAULT_LOCALE): Promise<DirectusPage> {
    const page = await this.cms.getPage(slug, locale)
    userInvariant(page, 'page not found', 404)

    return page
  }
}
