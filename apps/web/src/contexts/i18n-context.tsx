import { I18nInfo } from '@algomart/schemas'
import { createContext, ReactNode, useContext, useMemo } from 'react'

import { useCurrency } from '@/contexts/currency-context'
import { I18nState } from '@/types/i18n'
import { useAPI } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export const I18nContext = createContext<I18nState | null>(null)

export function useI18n() {
  const i18n = useContext(I18nContext)
  if (!i18n) {
    throw new Error('I18nProvider missing')
  }
  return i18n
}

export function useI18nProvider() {
  const { currency } = useCurrency()

  const {
    data: { currencyConversions, languages } = {},
    isLoading,
    error,
  } = useAPI<I18nInfo>(['i18n'], urls.api.i18n.base)

  const status = useMemo<I18nState['status']>(() => {
    if (error) return 'error'
    if (isLoading) return 'loading'
    return 'loaded'
  }, [error, isLoading])

  const value = useMemo(
    () => ({
      conversionRate: currencyConversions ? currencyConversions[currency] : 1,
      currencyConversions: currencyConversions ?? {},
      languages: languages ?? [],
      error: error instanceof Error ? error.message : String(error),
      status,
    }),
    [currency, currencyConversions, error, languages, status]
  )
  return value
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useI18nProvider()
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
