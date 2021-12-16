import { DEFAULT_CURRENCY } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import CurrencyInput from '@/components/currency-input/currency-input'
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
                amount: formatCurrency(initialBid, lang),
              })
            : undefined
        }
        id="bid-input"
        intlConfig={{ locale, currency: DEFAULT_CURRENCY }}
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
