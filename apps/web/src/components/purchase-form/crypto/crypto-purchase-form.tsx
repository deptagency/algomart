import {
  CheckoutMethod,
  CheckoutStatus,
  PackType,
  ToPaymentBase,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useState } from 'react'

import CryptoPurchaseError from './sections/crypto-error'
import CryptoForm from './sections/crypto-form'
import CryptoHeader from './sections/crypto-header'
import CryptoSuccess from './sections/crypto-success'

import css from './crypto-purchase-form.module.css'

import Loading from '@/components/loading/loading'
import { PaymentContextProps } from '@/contexts/payment-context'
import checkoutService from '@/services/checkout-service'
import { isAfterNow } from '@/utils/date-time'

export interface CryptoPurchaseFormProps {
  address: string | null
}

export default function CryptoPurchaseForm({
  address,
  bid,
  currentBid,
  formErrors,
  setStatus,
  handleRetry,
  handleSubmitBid: onSubmitBid,
  loadingText,
  packId,
  price,
  release,
  setBid,
  setPackId,
  status,
}: PaymentContextProps & CryptoPurchaseFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const isAuctionActive =
    release?.type === PackType.Auction &&
    isAfterNow(new Date(release.auctionUntil as string))
  const [error, setError] = useState<string>('')
  const [transfer, setTransfer] = useState<ToPaymentBase | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleCheckForPurchase = useCallback(async () => {
    setIsLoading(true)
    if (!address) {
      return router.reload()
    }
    // Check if purchase has been made for this address
    const transfer = await checkoutService.getTransferByAddress(address)
    // Initiate payment creation and transfer if so
    if (transfer) {
      setTransfer(transfer)
    }
    setIsLoading(false)
  }, [address, router])

  const handlePurchase = useCallback(async () => {
    if (!address || !release?.templateId || !transfer) {
      setError(t('forms:errors.invalidDetails'))
      setStatus(CheckoutStatus.error)
      return
    }
    // Creating payment for the pending transfer
    const transferPayment = await checkoutService.createTransferPayment({
      packTemplateId: release.templateId,
      transferId: transfer.externalId,
      destinationAddress: address,
    })
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
    return transferPayment
  }, [address, setStatus, release?.templateId, setPackId, t, transfer])

  const handleSubmitBid = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      return onSubmitBid(data, CheckoutMethod.crypto)
    },
    [onSubmitBid]
  )

  // Once there's a transfer found, we can initiate payment:
  useEffect(() => {
    if (transfer) {
      handlePurchase()
    }
  }, [handlePurchase, transfer])

  // If there's no address, redirect to the Checkout page:
  useEffect(() => {
    if (!address) router.push(router.asPath.split('?')[0])
  }, [address, router])

  return (
    <section className={css.root}>
      <CryptoHeader release={release} />

      {status === CheckoutStatus.form && (
        <CryptoForm
          address={address}
          bid={bid}
          className={status === CheckoutStatus.form ? 'w-full' : 'hidden'}
          currentBid={currentBid || null}
          formErrors={formErrors}
          handleCheckForPurchase={handleCheckForPurchase}
          setStatus={setStatus}
          handleSubmitBid={handleSubmitBid}
          isAuctionActive={isAuctionActive}
          isLoading={isLoading}
          price={price}
          release={release}
          setBid={setBid}
          setError={setError}
          setTransfer={setTransfer}
          transfer={transfer}
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
