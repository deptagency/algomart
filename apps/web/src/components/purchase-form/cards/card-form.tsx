import { PackType } from '@algomart/schemas'
import clsx from 'clsx'
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
import { formatIntToFloat } from '@/utils/format-currency'

export default function CardForm({
  bid,
  currentBid,
  release,
  formErrors,
  handleSubmitBid: onSubmitBid,
  handleSubmitPurchase: onSubmitPurchase,
  loadingText,
  packId,
  setBid,
  setStatus,
  status,
}: PaymentContextProps) {
  const { t } = useTranslation()
  const [promptLeaving, setPromptLeaving] = useState(false)
  const price =
    release?.type === PackType.Auction
      ? bid
      : formatIntToFloat(release?.price || 0)
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
        ? onSubmitBid(data, 'card')
        : onSubmitPurchase(data, true))
      setPromptLeaving(false)
    },
    [release?.auctionUntil, release?.type, onSubmitBid, onSubmitPurchase]
  )

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  return (
    <section className={css.root}>
      <CardPurchaseHeader release={release} />

      <form
        className={clsx(
          css.form,
          status === 'form' || status === 'summary' ? 'w-full' : 'hidden'
        )}
        onSubmit={handleSubmitPurchase}
      >
        <CardPurchaseForm
          bid={bid}
          className={status === 'form' ? 'w-full' : 'hidden'}
          currentBid={currentBid || null}
          formErrors={formErrors}
          isAuctionActive={isAuctionActive}
          setBid={setBid}
          handleContinue={() => setStatus('summary')}
        />
        {status === 'summary' && (
          <CardPurchaseSummary
            isAuctionActive={isAuctionActive}
            price={price}
            release={release}
          />
        )}
      </form>

      {status === 'loading' && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === 'success' && packId && (
        <CardPurchaseSuccess release={release} packId={packId} />
      )}

      {status === 'error' && (
        <CardPurchaseError
          error={t('forms:errors.failedPayment')}
          handleRetry={handleRetry}
        />
      )}
    </section>
  )
}
