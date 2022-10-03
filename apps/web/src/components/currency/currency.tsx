import { useCurrency } from '@/contexts/currency-context'
import { useI18n } from '@/contexts/i18n-context'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency, formatIntToFixed } from '@/utils/currency'

interface ICurrency {
  value: number
  noSymbol?: boolean
}

/**
 * Given a value in application currency (usually USD cents), renders it
 * in the local currency/locale.
 */
export default function Currency({ value, noSymbol }: ICurrency) {
  const locale = useLocale()
  const { currency } = useCurrency()
  const { conversionRate } = useI18n()

  return (
    <>
      {noSymbol
        ? formatIntToFixed(value, currency, conversionRate)
        : formatCurrency(value, locale, currency, conversionRate)}
    </>
  )
}
