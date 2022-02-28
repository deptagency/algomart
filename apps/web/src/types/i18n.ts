import {
  CurrencyConversionDict,
  I18nInfo,
  LanguageList,
} from '@algomart/schemas'

export interface I18nState {
  conversionRate: number
  currencyConversions: CurrencyConversionDict
  error: string | null
  languages: LanguageList
  status: 'not-loaded' | 'loading' | 'error' | 'loaded'
}

export interface I18nUtils extends I18nState {
  getCurrencyConversions: () => Promise<CurrencyConversionDict>
  getI18nInfo: () => Promise<I18nInfo>
  getLanguages: () => Promise<LanguageList>
}
