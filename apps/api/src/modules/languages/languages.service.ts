import { DEFAULT_LOCALE, LanguageList } from '@algomart/schemas'

import DirectusAdapter from '@/lib/directus-adapter'
import { userInvariant } from '@/utils/invariant'

export default class LanguagesService {
  constructor(private readonly cms: DirectusAdapter) {}

  async getLanguages(locale = DEFAULT_LOCALE): Promise<LanguageList> {
    const languages = await this.cms.getLanguages(locale)
    userInvariant(languages, 'languages not found', 404)

    return languages
  }
}
