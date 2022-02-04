import { LanguageList } from '@algomart/schemas'

import DirectusAdapter from '@/lib/directus-adapter'
import { userInvariant } from '@/utils/invariant'

export default class LanguagesService {
  constructor(private readonly cms: DirectusAdapter) {}

  async getLanguages(): Promise<LanguageList> {
    const languages = await this.cms.getLanguages()
    userInvariant(languages || languages.data, 'languages not found', 404)

    return languages.data
  }
}
