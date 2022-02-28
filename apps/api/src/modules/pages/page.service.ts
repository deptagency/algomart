import { DEFAULT_LOCALE, DirectusPageTranslation } from '@algomart/schemas'
import { CMSCacheAdapter } from '@algomart/shared/adapters'
import { userInvariant } from '@algomart/shared/utils'

export default class DirectusPageService {
  constructor(private readonly cms: CMSCacheAdapter) {}

  async getPage(
    slug,
    locale = DEFAULT_LOCALE
  ): Promise<DirectusPageTranslation> {
    const page = await this.cms.getPage(slug, locale)
    userInvariant(page, 'page not found', 404)

    return page
  }
}
