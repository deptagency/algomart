import { DEFAULT_CURRENCY, PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'

import css from './card-summary.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency } from '@/utils/format-currency'

interface CardSummaryProps {
  isAuctionActive: boolean
  price: string | null
  release?: PublishedPack
}

export default function CardSummary({
  isAuctionActive,
  price,
  release,
}: CardSummaryProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const currency = useCurrency()
  const { conversionRate } = useI18n()
  const userCurrencyAmount = formatCurrency(
    price,
    locale,
    currency,
    isAuctionActive ? 1 : conversionRate
  )
  const settlementCurrencyAmount = formatCurrency(
    price,
    locale,
    DEFAULT_CURRENCY,
    1
  )
  return (
    <div className={css.root}>
      <Heading level={1}>{t('forms:sections.Summary')}</Heading>
      <table className={css.paymentGrid}>
        <tbody>
          <tr>
            <th scope="row">{t('forms:fields.paymentMethods.label')}</th>
            <td>{t('forms:sections.Credit Card')}</td>
          </tr>
          <tr>
            <th scope="row">{release?.title}</th>
            <td>{userCurrencyAmount}</td>
          </tr>
        </tbody>
      </table>
      <p className={css.disclaimer}>
        {t('forms:fields.price.disclaimer', {
          currency,
          amount: settlementCurrencyAmount,
        })}
      </p>
      {/* Submit */}
      <Button disabled={!release} fullWidth type="submit" variant="primary">
        {isAuctionActive
          ? t('common:actions.Place Bid')
          : t('common:actions.Purchase')}
      </Button>
    </div>
  )
}
