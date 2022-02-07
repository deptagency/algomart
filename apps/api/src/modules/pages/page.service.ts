import { DEFAULT_LOCALE, DirectusPage } from '@algomart/schemas'

import DirectusAdapter from '@/lib/directus-adapter'
import { userInvariant } from '@/utils/invariant'

export default class DirectusPageService {
  constructor(private readonly cms: DirectusAdapter) {}

  async getDirectusPage(title, locale = DEFAULT_LOCALE): Promise<DirectusPage> {
    const page = await this.cms.getDirectusPage(title, locale)
    userInvariant(page, 'page not found', 404)

    return page
  }
}
