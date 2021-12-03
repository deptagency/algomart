import { PackType, PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import PurchaseError from './sections/card-error'
import PurchaseForm from './sections/card-form'
import PurchaseHeader from './sections/card-header'
import PurchaseSuccess from './sections/card-success'

import css from './card-form.module.css'

import Loading from '@/components/loading/loading'
import { usePaymentProvider } from '@/contexts/payment-context'
import { useWarningOnExit } from '@/hooks/use-warning-on-exit'
import { isAfterNow } from '@/utils/date-time'

export interface PurchaseNFTFormProps {
  auctionPackId: string | null
  currentBid: number | null
  release: PublishedPack
}

export default function PurchaseNFTForm({
  auctionPackId,
  currentBid,
  release,
}: PurchaseNFTFormProps) {
  const { t } = useTranslation()
  const [promptLeaving, setPromptLeaving] = useState(false)

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
      <PurchaseHeader release={release} />

      <div className={status === 'form' ? 'w-full' : 'hidden'}>
        <PurchaseForm
          formErrors={formErrors}
          currentBid={currentBid}
          onSubmit={handleSubmitPurchase}
          release={release}
        />
      </div>

      {status === 'loading' && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === 'success' && packId && (
        <PurchaseSuccess release={release} packId={packId} />
      )}

      {status === 'error' && (
        <PurchaseError
          error={t('forms:errors.failedPayment')}
          handleRetry={handleRetry}
        />
      )}
    </section>
  )
}
