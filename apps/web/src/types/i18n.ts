import { CurrencyConversionDict, DropdownLanguageList } from '@algomart/schemas'

export interface I18nState {
  conversionRate: number
  currencyConversions: CurrencyConversionDict
  error: string | null
  languages: DropdownLanguageList
  status: 'not-loaded' | 'loading' | 'error' | 'loaded'
}
