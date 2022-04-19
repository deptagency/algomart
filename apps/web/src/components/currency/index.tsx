import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency, formatIntToFixed } from '@/utils/currency'

interface ICurrency {
  value: number
  currency?: string
  locale?: string
  noSymbol?: boolean
}

/**
 * Given a value in application currency (usually USD cents), renders it
 * in the provided currency/locale.
 * Defaults to user's currency and locale.
 */
export default function Currency({
  value,
  noSymbol,
  currency,
  locale,
}: ICurrency) {
  const globalLocale = useLocale()
  const globalCurrency = useCurrency()
  const { conversionRate } = useI18n()

  const currencyCode = currency || globalCurrency
  const localeCode = locale || globalLocale
  return (
    <>
      {noSymbol
        ? formatIntToFixed(value, currencyCode, conversionRate)
        : formatCurrency(value, localeCode, currencyCode, conversionRate)}
    </>
  )
}
