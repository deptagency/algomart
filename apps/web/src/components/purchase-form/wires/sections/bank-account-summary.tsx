import { PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './bank-account-summary.module.css'

import Button from '@/components/button'
import Checkbox from '@/components/checkbox'
import Heading from '@/components/heading'
import { formatCurrency } from '@/utils/format-currency'

interface BankAccountSummaryProps {
  isAuctionActive: boolean
  price: string | null
  release: PublishedPack
}

export default function BankAccountSummary({
  isAuctionActive,
  price,
  release,
}: BankAccountSummaryProps) {
  const { t, lang } = useTranslation()
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)
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
            <th scope="row">{release.title}</th>
            <td>{formatCurrency(price, lang)}</td>
          </tr>
        </tbody>
      </table>
      <Checkbox
        checked={isConfirmed}
        name="confirmBid"
        label={t('forms:fields.bid.confirmation')}
        onChange={() => setIsConfirmed(!isConfirmed)}
      />
      {/* Submit */}
      <Button
        disabled={!release || (isAuctionActive && !isConfirmed)}
        fullWidth
        type="submit"
        variant="primary"
      >
        {isAuctionActive
          ? t('common:actions.Place Bid')
          : t('common:actions.Submit Payment Info')}
      </Button>
    </div>
  )
}
