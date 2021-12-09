import {
  GetPaymentBankAccountInstructions,
  PackType,
  PublishedPack,
} from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import BankAccountError from './sections/bank-account-error'
import BankAccountForm from './sections/bank-account-form'
import BankAccountHeader from './sections/bank-account-header'
import BankAccountSuccess from './sections/bank-account-success'

import css from './bank-account-form.module.css'

import Loading from '@/components/loading/loading'
import { usePaymentProvider } from '@/contexts/payment-context'
import { isAfterNow } from '@/utils/date-time'

export interface BankAccountFormProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function BankAccountPurchaseForm({
  auctionPackId,
  currentBid,
  release,
}: BankAccountFormProps) {
  const { t } = useTranslation()
  const [bankAccountInstructions, setBankAccountInstructions] =
    useState<GetPaymentBankAccountInstructions | null>(null)

  const {
    formErrors,
    handleSubmitBid: onSubmitBid,
    handleAddBankAccount: onSubmitBankAccount,
    loadingText,
    setStatus,
    status,
  } = usePaymentProvider({
    auctionPackId,
    currentBid,
    release,
  })

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      if (
        release.type === PackType.Auction &&
        isAfterNow(new Date(release.auctionUntil as string))
      ) {
        await onSubmitBid(data, 'wire')
      } else {
        const bankInstructions = await onSubmitBankAccount(data)
        if (bankInstructions) setBankAccountInstructions(bankInstructions)
      }
    },
    [release.auctionUntil, release.type, onSubmitBankAccount, onSubmitBid]
  )

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  return (
    <section className={css.root}>
      <BankAccountHeader release={release} />

      <div className={status === 'form' ? 'w-full' : 'hidden'}>
        <BankAccountForm
          formErrors={formErrors}
          currentBid={currentBid}
          onSubmit={handleSubmit}
          release={release}
        />
      </div>

      {status === 'loading' && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === 'success' && (
        <BankAccountSuccess
          bankAccountInstructions={bankAccountInstructions}
          currentBid={currentBid}
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
