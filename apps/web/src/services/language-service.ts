import { DEFAULT_LOCALE, LanguageList } from '@algomart/schemas'
import ky from 'ky'

import { urls } from '@/utils/urls'

export interface LanguageAPI {
  getLanguages(locale: string): Promise<LanguageList>
}

export class LanguageService implements LanguageAPI {
  http: typeof ky

  constructor() {
    this.http = ky.create({
      timeout: 10_000,
      throwHttpErrors: false,
    })
  }

  /**
   *
   * @param locale - Locale sent for getting translated language label names
   * @returns
   */
  async getLanguages(locale = DEFAULT_LOCALE): Promise<LanguageList> {
    const response = await this.http
      .get(urls.api.v1.getLanguages, {
        searchParams: {
          locale,
        },
      })
      .json<LanguageList>()

    return response
  }
}

const languageService: LanguageAPI = new LanguageService()

export default languageService
