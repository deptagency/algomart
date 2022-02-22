import { DEFAULT_CURRENCY } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import CurrencyInput from '@/components/currency-input/currency-input'
import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/format-currency'

export interface BidProps {
  bid: string | null
  className?: string
  initialBid?: string
  setBid: (bid: string | null) => void
}

export default function Bid({ bid, className, initialBid, setBid }: BidProps) {
  const locale = useLocale()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const { t, lang } = useTranslation()

  return (
    <>
      <CurrencyInput
        className={className}
        decimalsLimit={2}
        handleChange={(value) => setBid(value)}
        helpText={
          initialBid
            ? t('forms:fields.bid.helpTextCurrentBid', {
                amount: formatCurrency(
                  initialBid,
                  lang,
                  currency,
                  conversionRate
                ),
              })
            : undefined
        }
        id="bid-input"
        intlConfig={{ locale, currency }}
        label={t('forms:fields.bid.label')}
        name="bid-input"
        value={bid || ''}
        variant={'small'}
      />
      {/* Force formData to be built from this "unmasked" value */}
      <input id="bid" name="bid" type="hidden" value={bid as string} />
    </>
  )
}
