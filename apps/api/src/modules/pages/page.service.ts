import { DEFAULT_LOCALE, DirectusPage } from '@algomart/schemas'
import { CMSCacheAdapter } from '@algomart/shared/adapters'
import { userInvariant } from '@algomart/shared/utils'

export default class DirectusPageService {
  constructor(private readonly cms: CMSCacheAdapter) { }

  async getDirectusPage(slug, locale = DEFAULT_LOCALE): Promise<DirectusPage> {
    const page = await this.cms.getDirectusPage(slug, locale)
    userInvariant(page, 'page not found', 404)

    return page
  }
}
