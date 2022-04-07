import {
  CheckoutMethod,
  CheckoutStatus,
  ToPaymentBase,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import CryptoError from './sections/crypto-error'
import CryptoForm from './sections/crypto-form'
import CryptoHeader from './sections/crypto-header'
import CryptoSuccess from './sections/crypto-success'

import css from './crypto-purchase-form.module.css'

import Loading from '@/components/loading/loading'
import { usePaymentContext } from '@/contexts/payment-context'
import { CheckoutService } from '@/services/checkout-service'

export interface CryptoPurchaseFormProps {
  address: string | null
}

export default function CryptoPurchaseForm({
  address,
}: CryptoPurchaseFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const {
    handleRetry,
    handleSubmitBid: onSubmitBid,
    loadingText,
    packId,
    release,
    setLoadingText,
    setPackId,
    setStatus,
    status,
  } = usePaymentContext()
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handlePurchase = useCallback(
    async (transfer: ToPaymentBase) => {
      setLoadingText(t('common:statuses.Checking for Payment'))
      // Validate details
      if (!address || !release?.templateId || !transfer) {
        setError(t('forms:errors.invalidDetails'))
        setStatus(CheckoutStatus.error)
        return
      }
      // Creating payment for the pending transfer
      setLoadingText(t('common:statuses.Creating Payment'))
      const transferPayment = await CheckoutService.instance
        .createTransferPayment({
          packTemplateId: release.templateId,
          transferId: transfer.externalId,
          destinationAddress: address,
        })
        .catch(() => null)
      if (!transferPayment) {
        // While this shouldn't happen, there's a possibility the payment may still have worked
        // @TODO: Find way to handle this better - possibly send to customer support email or direct to contact
        setError(t('forms:errors.paymentNotCreated'))
        setStatus(CheckoutStatus.error)
        return
      }
      if (transferPayment.packId) {
        setPackId(transferPayment.packId)
      }
      // Success!
      setStatus(CheckoutStatus.success)
      return
    },
    [address, release?.templateId, setLoadingText, setPackId, setStatus, t]
  )

  const handleSubmitBid = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      return onSubmitBid(data, CheckoutMethod.crypto)
    },
    [onSubmitBid]
  )

  const handleCheckForPurchase = useCallback(async () => {
    setIsLoading(true)
    if (!address) {
      return router.reload()
    }
    // Otherwise, check if purchase has been made for this address
    const transferResp = await CheckoutService.instance.getTransferByAddress(
      address
    )
    if (transferResp) {
      handlePurchase(transferResp)
    }
    setIsLoading(false)
  }, [address, handlePurchase, router])

  return (
    <section className={css.root}>
      <CryptoHeader release={release} />

      {status === CheckoutStatus.form && (
        <CryptoForm
          className={status === CheckoutStatus.form ? 'w-full' : 'hidden'}
          handleCheckForPurchase={handleCheckForPurchase}
          handlePurchase={handlePurchase}
          handleSubmitBid={handleSubmitBid}
          isLoading={isLoading}
          setError={setError}
        />
      )}

      {status === CheckoutStatus.loading && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === CheckoutStatus.success && packId && <CryptoSuccess />}

      {status === CheckoutStatus.error && (
        <CryptoError error={error} handleRetry={handleRetry} />
      )}
    </section>
  )
}
