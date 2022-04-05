import {
  CurrencyConversionDict,
  DEFAULT_LANG,
  DropdownLanguageList,
  I18nInfo,
} from '@algomart/schemas'
import ky from 'ky'

import { urls } from '@/utils/urls'

export interface I18nApi {
  getCurrencyConversions(
    sourceCurrency?: string
  ): Promise<CurrencyConversionDict>
  getI18nInfo(language: string): Promise<I18nInfo>
  getLanguages(language: string): Promise<DropdownLanguageList>
}

export class I18nService implements I18nApi {
  http: typeof ky
  private static _instance: I18nService

  static get instance() {
    return this._instance || (this._instance = new I18nService())
  }

  constructor() {
    this.http = ky.create({
      timeout: 10_000,
      throwHttpErrors: false,
    })
  }

  /**
   *
   * @param sourceCurrency - Source currency for conversion
   * @returns
   */
  async getCurrencyConversions(
    sourceCurrency?: string
  ): Promise<CurrencyConversionDict> {
    const response = await this.http
      .get(urls.api.v1.getCurrencyConversions, {
        searchParams: {
          sourceCurrency,
        },
      })
      .json<CurrencyConversionDict>()

    return response
  }

  /**
   *
   * @param language - language sent for getting translated language label names
   * @returns
   */
  async getI18nInfo(language = DEFAULT_LANG): Promise<I18nInfo> {
    const response = await this.http
      .get(urls.api.v1.getI18nInfo, {
        searchParams: {
          language,
        },
      })
      .json<I18nInfo>()

    return response
  }

  /**
   *
   * @param language - language sent for getting translated language label names
   * @returns
   */
  async getLanguages(language = DEFAULT_LANG): Promise<DropdownLanguageList> {
    const response = await this.http
      .get(urls.api.v1.getLanguages, {
        searchParams: {
          language,
        },
      })
      .json<DropdownLanguageList>()

    return response
  }
}

const i18nService: I18nApi = new I18nService()

export default i18nService
