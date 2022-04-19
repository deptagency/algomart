import useTranslation from 'next-translate/useTranslation'

import CurrencyInput from '@/components/currency-input/currency-input'
import Heading from '@/components/heading'
import { useI18n } from '@/contexts/i18n-context'
import { usePaymentContext } from '@/contexts/payment-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/currency'

export interface BidProps {
  className?: string
}

export default function Bid({ className }: BidProps) {
  const locale = useLocale()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const { t } = useTranslation()
  const { bid, highestBid, setBid } = usePaymentContext()

  const currentBidText = t('forms:fields.bid.helpTextCurrentBid', {
    amount: formatCurrency(highestBid, locale, currency, conversionRate),
  })

  return (
    <>
      {highestBid ? <Heading level={2}>{currentBidText}</Heading> : null}
      <CurrencyInput
        className={className}
        decimalsLimit={2}
        onChange={setBid}
        label={t('forms:fields.bid.label')}
        value={bid}
        variant="small"
      />
      {/* Force formData to be built from this "unmasked" value */}
      <input tabIndex={-1} id="bid" name="bid" type="hidden" value={bid} />
    </>
  )
}
