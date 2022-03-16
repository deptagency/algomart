import {
  CheckoutMethod,
  CheckoutStatus,
  PackType,
  ToPaymentBase,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useState } from 'react'

import CryptoPurchaseError from './sections/crypto-error'
import CryptoForm from './sections/crypto-form'
import CryptoHeader from './sections/crypto-header'
import CryptoSuccess from './sections/crypto-success'

import css from './crypto-purchase-form.module.css'

import Loading from '@/components/loading/loading'
import { PaymentContextProps } from '@/contexts/payment-context'
import { CheckoutService } from '@/services/checkout-service'
import { isAfterNow } from '@/utils/date-time'

export interface CryptoPurchaseFormProps {
  address: string | null
}

export default function CryptoPurchaseForm({
  address,
  bid,
  formErrors,
  handleRetry,
  handleSubmitBid: onSubmitBid,
  loadingText,
  packId,
  price,
  release,
  setBid,
  setLoadingText,
  setPackId,
  setStatus,
  status,
}: PaymentContextProps & CryptoPurchaseFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
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
          address={address}
          bid={bid}
          className={status === CheckoutStatus.form ? 'w-full' : 'hidden'}
          formErrors={formErrors}
          handleCheckForPurchase={handleCheckForPurchase}
          handlePurchase={handlePurchase}
          setStatus={setStatus}
          handleSubmitBid={handleSubmitBid}
          isAuctionActive={isAuctionActive}
          isLoading={isLoading}
          price={price}
          release={release}
          setBid={setBid}
          setError={setError}
          setLoadingText={setLoadingText}
        />
      )}

      {status === CheckoutStatus.loading && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === CheckoutStatus.success && packId && (
        <CryptoSuccess packId={packId} release={release} />
      )}

      {status === CheckoutStatus.error && (
        <CryptoPurchaseError error={error} handleRetry={handleRetry} />
      )}
    </section>
  )
}
