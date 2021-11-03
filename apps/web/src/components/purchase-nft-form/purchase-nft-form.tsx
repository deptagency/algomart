import { PackType, PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import PurchaseError from './sections/purchase-error'
import PurchaseForm from './sections/purchase-form'
import PurchaseHeader from './sections/purchase-header'
import PurchasePassphrase from './sections/purchase-passphrase'
import PurchaseSuccess from './sections/purchase-success'

import css from './purchase-nft-form.module.css'

import Loading from '@/components/loading/loading'
import { usePaymentProvider } from '@/contexts/payment-context'
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
  const [passphraseError, setPassphraseError] = useState<string>('')
  const { t } = useTranslation()

  const {
    formErrors,
    handleSubmitBid: onSubmitBid,
    handleSubmitPassphrase: onSubmitPassphrase,
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

  const handleSubmitPassphrase = useCallback(
    async (passphrase: string) => {
      setPassphraseError('')
      const isValidPassphrase = await onSubmitPassphrase(passphrase)
      if (!isValidPassphrase) {
        setPassphraseError(t('forms:errors.invalidPassphrase'))
      }
    },
    [onSubmitPassphrase, setPassphraseError, t]
  )

  const handleSubmitPurchase = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      await (release.type === PackType.Auction &&
      isAfterNow(new Date(release.auctionUntil as string))
        ? onSubmitBid(data)
        : onSubmitPurchase(data, true))
    },
    [release.auctionUntil, release.type, onSubmitBid, onSubmitPurchase]
  )

  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  return (
    <section className={css.root}>
      <PurchaseHeader release={release} />

      {status === 'passphrase' && (
        <PurchasePassphrase
          error={passphraseError}
          handleSubmitPassphrase={handleSubmitPassphrase}
        />
      )}

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
