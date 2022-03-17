import { PublishedPack } from '@algomart/schemas'
import { InformationCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './bank-account-summary.module.css'

import Button from '@/components/button'
import Checkbox from '@/components/checkbox'
import Heading from '@/components/heading'
import { currency, formatCurrency } from '@/utils/format-currency'

interface BankAccountSummaryProps {
  isAuctionActive: boolean
  price: string | null
  release?: PublishedPack
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
            <td>{t('forms:sections.Wire Transfer')}</td>
          </tr>
        </tbody>
      </table>
      {!isAuctionActive && (
        <div className={css.bankInstructionsNotice}>
          <div className={css.noticeIconWrapper}>
            <InformationCircleIcon className={css.noticeIcon} />
          </div>
          <p>{t('forms:fields.bankInstructions.notice')}</p>
        </div>
      )}
      <table className={clsx(css.paymentGrid, css.paymentDetails)}>
        <tbody>
          <tr>
            <th scope="row">{release?.title}</th>
            <td>
              {formatCurrency(price, lang)} {currency?.code && currency.code}
            </td>
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
        className={css.continueButton}
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
