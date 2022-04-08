import {
  CheckoutMethod,
  CheckoutStatus,
  PaymentBankAccountInstructions,
} from '@algomart/schemas'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import BankAccountError from './sections/bank-account-error'
import BankAccountForm from './sections/bank-account-form'
import BankAccountHeader from './sections/bank-account-header'
import BankAccountSuccess from './sections/bank-account-success'
import BankAccountSummary from './sections/bank-account-summary'

import css from './bank-account-form.module.css'

import Loading from '@/components/loading/loading'
import { usePaymentContext } from '@/contexts/payment-context'

export default function BankAccountPurchaseForm() {
  const { t } = useTranslation()
  const { asPath, push } = useRouter()
  const {
    handleAddBankAccount: onSubmitBankAccount,
    handleRetry,
    handleSubmitBid: onSubmitBid,
    isAuctionActive,
    loadingText,
    release,
    status,
  } = usePaymentContext()
  const [bankAccountInstructions, setBankAccountInstructions] =
    useState<PaymentBankAccountInstructions | null>(null)

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      if (isAuctionActive()) {
        await onSubmitBid(data, CheckoutMethod.wire)
      } else {
        const bankInstructions = await onSubmitBankAccount(data)
        if (bankInstructions) setBankAccountInstructions(bankInstructions)
      }
    },
    [release?.auctionUntil, release?.type, onSubmitBankAccount, onSubmitBid]
  )

  return (
    <section className={css.root}>
      <BankAccountHeader release={release} />

      <form
        className={clsx(
          css.form,
          status === CheckoutStatus.form || status === CheckoutStatus.summary
            ? 'w-full'
            : 'hidden'
        )}
        onSubmit={handleSubmit}
      >
        <BankAccountForm
          className={status === CheckoutStatus.form ? 'w-full' : 'hidden'}
          handleContinue={() => push(`${asPath.split('?')[0]}?step=summary`)}
        />
        {status === CheckoutStatus.summary && <BankAccountSummary />}
      </form>

      {status === CheckoutStatus.loading && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === CheckoutStatus.success && (
        <BankAccountSuccess
          bankAccountInstructions={bankAccountInstructions}
          release={release}
        />
      )}

      {status === CheckoutStatus.error && (
        <BankAccountError
          error={t('forms:errors.failedPayment')}
          handleRetry={handleRetry}
        />
      )}
    </section>
  )
}
