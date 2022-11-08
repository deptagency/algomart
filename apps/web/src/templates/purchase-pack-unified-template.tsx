import { CheckoutStatus } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback } from 'react'

import CcPaymentForm from '@/components/payment-form/cc-payment-form'
import UsdcPaymentForm from '@/components/payment-form/usdc-payment-form'
import PurchaseProductStatus from '@/components/purchase-product-status/purchase-product-status'
import { useProductUnifiedPaymentContext } from '@/contexts/product-unified-payment-context'
import { PurchaseStep } from '@/contexts/purchase-credits-context'
import { urlFor, urls } from '@/utils/urls'

export default function PurchasePackUnifiedTemplate() {
  const { push } = useRouter()
  const { t } = useTranslation()

  const {
    countries,
    destinationAddress,
    formErrors,
    getError,
    handlePaymentSuccess,
    handleSelectedCountryChange,
    handleSubmitCcPayment,
    handleSubmitUsdcPayment,
    isVerificationEnabled,
    isVerificationNeeded,
    loadingText,
    paymentOption,
    product,
    purchasedProductId,
    selectedCountry,
    setFormErrors,
    setLoadingText,
    setPaymentOption,
    setPurchasedProductId,
    setStep,
    setStatus,
    status,
    step,
  } = useProductUnifiedPaymentContext()

  const handleRetry = useCallback(() => {
    setPurchasedProductId(null)
    setStatus(CheckoutStatus.form)
  }, [setPurchasedProductId, setStatus])

  const handleSuccessAction = useCallback(() => {
    push(urlFor(urls.packOpening, { packId: purchasedProductId }))
  }, [push, purchasedProductId])

  return (
    <>
      {!purchasedProductId && product?.price && (
        <>
          {/* Paying with cc */}
          {step === PurchaseStep.form && (
            <CcPaymentForm
              amount={product?.price}
              countries={countries}
              formErrors={formErrors}
              getError={getError}
              handleSelectedCountryChange={handleSelectedCountryChange}
              handleSubmitPayment={handleSubmitCcPayment}
              isCombinedPurchase={true}
              isVerificationEnabled={isVerificationEnabled}
              isVerificationNeeded={isVerificationNeeded}
              loadingText={loadingText}
              paymentOption={paymentOption}
              selectedCountry={selectedCountry}
              setFormErrors={setFormErrors}
              setPaymentOption={setPaymentOption}
              setStep={setStep}
            />
          )}

          {/* Paying with usdc */}
          {step === PurchaseStep.walletConnect && (
            <UsdcPaymentForm
              amount={product?.price}
              destinationAddress={destinationAddress}
              handlePurchaseSuccess={handlePaymentSuccess}
              handleSubmitPayment={handleSubmitUsdcPayment}
              loadingText={loadingText}
              setLoadingText={setLoadingText}
            />
          )}
        </>
      )}

      {/* Status of purchase*/}
      {!!purchasedProductId && (
        <PurchaseProductStatus
          loadingText={loadingText}
          status={status}
          handleSuccessAction={handleSuccessAction}
          handleRetry={handleRetry}
          successActionLabel={t('common:actions.Open Pack')}
        />
      )}
    </>
  )
}
