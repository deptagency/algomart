import { PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './card-success.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { formatCurrency } from '@/utils/format-currency'

interface CardSummaryProps {
  isAuctionActive: boolean
  price: string | null
  release: PublishedPack
}

export default function CardSummary({
  isAuctionActive,
  price,
  release,
}: CardSummaryProps) {
  const { t, lang } = useTranslation()
  return (
    <div className={css.root}>
      <Heading level={1}>{t('forms:sections.Summary')}</Heading>
      <table>
        <tr>
          <th>{t('forms:sections.Summary')}</th>
          <td>{t('forms:sections.Credit Card')}</td>
        </tr>
        <tr>
          <th>{release.title}</th>
          <td>{formatCurrency(price, lang)}</td>
        </tr>
      </table>
      {/* Submit */}
      <Button disabled={!release} fullWidth type="submit" variant="primary">
        {isAuctionActive
          ? t('common:actions.Place Bid')
          : t('common:actions.Purchase')}
      </Button>
    </div>
  )
}
