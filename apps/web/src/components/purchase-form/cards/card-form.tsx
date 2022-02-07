import { CheckoutMethod, CheckoutStatus, PackType } from '@algomart/schemas'
import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import CardPurchaseError from './sections/card-error'
import CardPurchaseForm from './sections/card-form'
import CardPurchaseHeader from './sections/card-header'
import CardPurchaseSuccess from './sections/card-success'
import CardPurchaseSummary from './sections/card-summary'

import css from './card-form.module.css'

import Loading from '@/components/loading/loading'
import { PaymentContextProps } from '@/contexts/payment-context'
import { useWarningOnExit } from '@/hooks/use-warning-on-exit'
import { isAfterNow } from '@/utils/date-time'

export default function CardForm({
  bid,
  release,
  formErrors,
  handleRetry,
  handleSubmitBid: onSubmitBid,
  handleSubmitPurchase: onSubmitPurchase,
  loadingText,
  packId,
  price,
  promptLeaving,
  setBid,
  setPromptLeaving,
  status,
}: PaymentContextProps) {
  const { t } = useTranslation()
  const { asPath, push } = useRouter()
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  useWarningOnExit(promptLeaving, t('common:statuses.processingPayment'))

  const handleSubmitPurchase = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setPromptLeaving(true)
      const data = new FormData(event.currentTarget)
      await (release?.type === PackType.Auction &&
      isAfterNow(new Date(release.auctionUntil as string))
        ? onSubmitBid(data, CheckoutMethod.card)
        : onSubmitPurchase(data, true))
      setPromptLeaving(false)
    },
    [
      setPromptLeaving,
      release?.type,
      release.auctionUntil,
      onSubmitBid,
      onSubmitPurchase,
    ]
  )

  return (
    <section className={css.root}>
      <CardPurchaseHeader title={release.title} image={release.image} />

      <form
        className={clsx(
          css.form,
          status === CheckoutStatus.form || status === CheckoutStatus.summary
            ? 'w-full'
            : 'hidden'
        )}
        onSubmit={handleSubmitPurchase}
      >
        <CardPurchaseForm
          bid={bid}
          className={status === CheckoutStatus.form ? 'w-full' : 'hidden'}
          formErrors={formErrors}
          isAuctionActive={isAuctionActive}
          setBid={setBid}
          handleContinue={() => push(`${asPath.split('?')[0]}?step=summary`)}
        />
        {status === CheckoutStatus.summary && (
          <CardPurchaseSummary
            isAuctionActive={isAuctionActive}
            price={price}
            release={release}
          />
        )}
      </form>

      {status === CheckoutStatus.loading && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === CheckoutStatus.success && packId && (
        <CardPurchaseSuccess release={release} packId={packId} />
      )}

      {status === CheckoutStatus.error && (
        <CardPurchaseError
          error={t('forms:errors.failedPayment')}
          handleRetry={handleRetry}
        />
      )}
    </section>
  )
}
