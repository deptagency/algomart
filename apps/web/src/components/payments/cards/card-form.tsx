import { PackType, PublishedPack } from '@algomart/schemas'
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
import { usePaymentProvider } from '@/contexts/payment-context'
import { useWarningOnExit } from '@/hooks/use-warning-on-exit'
import { isAfterNow } from '@/utils/date-time'
import { formatIntToFloat } from '@/utils/format-currency'

export interface CardPurchaseFormProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function CardForm({
  auctionPackId,
  currentBid,
  release,
}: CardPurchaseFormProps) {
  const { t } = useTranslation()
  const initialBid = currentBid ? formatIntToFloat(currentBid) : '0'
  const [bid, setBid] = useState<string | null>(initialBid)
  const [promptLeaving, setPromptLeaving] = useState(false)
  const price =
    release.type === PackType.Auction ? bid : formatIntToFloat(release.price)
  const isAuctionActive =
    release.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  useWarningOnExit(promptLeaving, t('common:statuses.processingPayment'))

  const {
    formErrors,
    handleSubmitBid: onSubmitBid,
    handleSubmitPurchase: onSubmitPurchase,
    loadingText,
    packId,
    setStatus,
    status,
  } = usePaymentProvider({
    auctionPackId,
    currentBid,
    release,
  })

  const handleSubmitPurchase = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setPromptLeaving(true)
      const data = new FormData(event.currentTarget)
      await (release.type === PackType.Auction &&
      isAfterNow(new Date(release.auctionUntil as string))
        ? onSubmitBid(data)
        : onSubmitPurchase(data, true))
      setPromptLeaving(false)
    },
    [release.auctionUntil, release.type, onSubmitBid, onSubmitPurchase]
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
          currentBid={currentBid}
          formErrors={formErrors}
          isAuctionActive={isAuctionActive}
          setBid={setBid}
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
