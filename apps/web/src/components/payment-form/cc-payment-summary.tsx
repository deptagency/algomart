import { PaymentOption } from '@algomart/schemas'
import { calculateCreditCardFees } from '@algomart/shared/utils'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import AppLink from '../app-link/app-link'

import css from './cc-payment-summary.module.css'

import Credits from '@/components/currency/credits'
import { FilterableSelectOption } from '@/components/filterable-select'
import { H4 } from '@/components/heading'

export interface CcPaymentSummaryProps {
  amount: number
  paymentOption: PaymentOption
  selectedCountry: FilterableSelectOption
}

export default function CcPaymentSummary({
  amount,
  paymentOption,
  selectedCountry,
}: CcPaymentSummaryProps) {
  const { t } = useTranslation()

  const { feesN } = useMemo(
    () => calculateCreditCardFees(amount, selectedCountry?.value),
    [amount, selectedCountry]
  )

  let lineItems: JSX.Element

  let total = amount
  if (paymentOption === PaymentOption.Card) {
    const fee = Number(feesN)
    const taxes = 0
    total = amount + taxes + fee

    lineItems = (
      <dl>
        <div className={css.lineItem}>
          <dt>{t('forms:purchaseCredits.Amount')}</dt>
          <dd>
            <Credits parentheses value={amount} />
          </dd>
        </div>
        {fee > 0 && (
          <div className={css.lineItem}>
            <dt>{t('forms:purchaseCredits.Card Processing Fee')}</dt>
            <dd>
              <Credits parentheses value={fee} />
            </dd>
          </div>
        )}
        {taxes > 0 && (
          <div className={css.lineItem}>
            <dt>{t('forms:purchaseCredits.Taxes')}</dt>
            <dd>
              <Credits parentheses value={taxes} />
            </dd>
          </div>
        )}
        {taxes + fee > 0 && (
          <div className={css.lineItem}>
            <dt>
              <strong>{t('forms:purchaseCredits.Total to be charged')}</strong>
            </dt>
            <dd>
              <strong>
                <Credits parentheses value={total} />
              </strong>
            </dd>
          </div>
        )}
      </dl>
    )
  }

  if (paymentOption === PaymentOption.USDC) {
    lineItems = (
      <dl>
        <div className={css.lineItem}>
          <dt>{t('forms:purchaseCredits.Total to be deposited')}</dt>
          <dd>
            <Credits value={amount} />
          </dd>
        </div>
      </dl>
    )
  }

  return (
    <div className={css.transactionSummary}>
      <H4 className={css.title}>
        {t('forms:purchaseCredits.Transaction Summary')}
      </H4>
      {lineItems}
      <div className={css.legalese}>
        <p>
          <Trans
            components={[<Credits key={0} parentheses value={total} />]}
            i18nKey="forms:purchaseCredits.legalese"
          />
        </p>
      </div>
    </div>
  )
}
