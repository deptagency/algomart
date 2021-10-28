import { PackType, PublishedPack } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'
import { ExtractError } from 'validator-fns'

import PurchaseError from './sections/purchase-error'
import PurchaseForm from './sections/purchase-form'
import PurchaseHeader from './sections/purchase-header'
import PurchasePassphrase from './sections/purchase-passphrase'
import PurchaseSuccess from './sections/purchase-success'

import css from './purchase-nft-form.module.css'

import Loading from '@/components/loading/loading'
import { CheckoutStatus } from '@/pages/checkout'
import { isAfterNow } from '@/utils/date-time'
import {
  validateBidsForm,
  validateExpirationDate,
  validatePurchaseForm,
} from '@/utils/purchase-validation'

export interface PurchaseNFTFormProps {
  formErrors?: ExtractError<
    ReturnType<
      | typeof validateBidsForm
      | typeof validatePurchaseForm
      | typeof validateExpirationDate
    >
  >
  loadingText: string
  onSubmitBid(data: FormData): Promise<void>
  onSubmitPassphrase(passphrase: string): Promise<boolean>
  onSubmitPurchase(data: FormData): Promise<void>
  currentBid: number | null
  packId: string | null
  release: PublishedPack
  setStatus: (status: CheckoutStatus) => void
  status: CheckoutStatus
}

export default function PurchaseNFTForm({
  formErrors,
  loadingText,
  onSubmitBid,
  onSubmitPassphrase,
  onSubmitPurchase,
  currentBid,
  packId,
  release,
  setStatus,
  status,
}: PurchaseNFTFormProps) {
  const [passphraseError, setPassphraseError] = useState<string>('')
  const { t } = useTranslation()

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
        isAfterNow(new Date(release.auctionUntil as string)) ? onSubmitBid(data) : onSubmitPurchase(data));
    },
    [release.auctionUntil, release.type, onSubmitBid, onSubmitPurchase]
  )

  const handleRetry = useCallback(() => {
    setStatus('purchase')
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

      <div className={status === 'purchase' ? 'w-full' : 'hidden'}>
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
