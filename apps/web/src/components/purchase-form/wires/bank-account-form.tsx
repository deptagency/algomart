import { PackType, PaymentBankAccountInstructions } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import BankAccountError from './sections/bank-account-error'
import BankAccountForm from './sections/bank-account-form'
import BankAccountHeader from './sections/bank-account-header'
import BankAccountSuccess from './sections/bank-account-success'
import BankAccountSummary from './sections/bank-account-summary'

import css from './bank-account-form.module.css'

import Loading from '@/components/loading/loading'
import { PaymentContextProps } from '@/contexts/payment-context'
import { isAfterNow } from '@/utils/date-time'
import { formatIntToFloat } from '@/utils/format-currency'

export default function BankAccountPurchaseForm({
  bid,
  currentBid,
  formErrors,
  handleSubmitBid: onSubmitBid,
  handleAddBankAccount: onSubmitBankAccount,
  initialBid,
  loadingText,
  release,
  setBid,
  setStatus,
  status,
}: PaymentContextProps) {
  const { t } = useTranslation()
  const [bankAccountInstructions, setBankAccountInstructions] =
    useState<PaymentBankAccountInstructions | null>(null)
  const price =
    release?.type === PackType.Auction
      ? bid
      : formatIntToFloat(release?.price || 0)
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      if (
        release?.type === PackType.Auction &&
        isAfterNow(new Date(release.auctionUntil as string))
      ) {
        await onSubmitBid(data, 'wire')
      } else {
        const bankInstructions = await onSubmitBankAccount(data)
        if (bankInstructions) setBankAccountInstructions(bankInstructions)
      }
    },
    [release?.auctionUntil, release?.type, onSubmitBankAccount, onSubmitBid]
  )

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  return (
    <section className={css.root}>
      <BankAccountHeader release={release} />

      <form
        className={clsx(
          css.form,
          status === 'form' || status === 'summary' ? 'w-full' : 'hidden'
        )}
        onSubmit={handleSubmit}
      >
        <BankAccountForm
          bid={bid}
          className={status === 'form' ? 'w-full' : 'hidden'}
          currentBid={currentBid}
          formErrors={formErrors}
          handleContinue={() => setStatus('summary')}
          initialBid={initialBid}
          release={release}
          setBid={setBid}
        />
        {status === 'summary' && (
          <BankAccountSummary
            isAuctionActive={isAuctionActive}
            price={price}
            release={release}
          />
        )}
      </form>

      {status === 'loading' && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === 'success' && (
        <BankAccountSuccess
          bankAccountInstructions={bankAccountInstructions}
          release={release}
        />
      )}

      {status === 'error' && (
        <BankAccountError
          error={t('forms:errors.failedPayment')}
          handleRetry={handleRetry}
        />
      )}
    </section>
  )
}
