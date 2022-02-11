import {
  CurrencyConversionList,
  DEFAULT_LOCALE,
  I18nInfo,
  LanguageList,
} from '@algomart/schemas'
import ky from 'ky'

import { urls } from '@/utils/urls'

export interface I18nApi {
  getCurrencyConversions(
    sourceCurrency?: string
  ): Promise<CurrencyConversionList>
  getI18nInfo(locale: string): Promise<I18nInfo>
  getLanguages(locale: string): Promise<LanguageList>
}

export class I18nService implements I18nApi {
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
  async getCurrencyConversions(
    sourceCurrency?: string
  ): Promise<CurrencyConversionList> {
    try {
      const response = await this.http
        .get(urls.api.v1.getCurrencyConversions, {
          searchParams: {
            sourceCurrency,
          },
        })
        .json<CurrencyConversionList>()

      return response
    } catch {
      return null
    }
  }

  /**
   *
   * @param locale - Locale sent for getting translated language label names
   * @returns
   */
  async getI18nInfo(locale = DEFAULT_LOCALE): Promise<I18nInfo> {
    try {
      const response = await this.http
        .get(urls.api.v1.getI18nInfo, {
          searchParams: {
            locale,
          },
        })
        .json<I18nInfo>()

      return response
    } catch {
      return null
    }
  }

  /**
   *
   * @param locale - Locale sent for getting translated language label names
   * @returns
   */
  async getLanguages(locale = DEFAULT_LOCALE): Promise<LanguageList> {
    try {
      const response = await this.http
        .get(urls.api.v1.getLanguages, {
          searchParams: {
            locale,
          },
        })
        .json<LanguageList>()

      return response
    } catch {
      return null
    }
  }
}

const i18nService: I18nApi = new I18nService()

export default i18nService
