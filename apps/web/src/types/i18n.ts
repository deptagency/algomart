import {
  CurrencyConversionList,
  I18nInfo,
  LanguageList,
} from '@algomart/schemas'

export interface I18nState {
  currencyConversions: CurrencyConversionList
  error: string | null
  languages: LanguageList
  status: 'loading' | 'error' | 'loaded'
}

export interface I18nUtils extends I18nState {
  getCurrencyConversions: () => Promise<CurrencyConversionList>
  getI18nInfo: () => Promise<I18nInfo>
  getLanguages: () => Promise<LanguageList>
}
