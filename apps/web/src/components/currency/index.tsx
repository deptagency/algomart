import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency, formatIntToFloat } from '@/utils/format-currency'

interface ICurrency {
  value: number
  currency?: string
  locale?: string
  noSymbol?: boolean
}

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
        ? formatIntToFloat(value, currencyCode, conversionRate)
        : formatCurrency(value, localeCode, currencyCode, conversionRate)}
    </>
  )
}
