import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback } from 'react'

import css from './purchase-collectible-template.module.css'

import LinkButton from '@/components/link-button'
import CcPaymentForm from '@/components/payment-form/cc-payment-form'
import UsdcPaymentForm from '@/components/payment-form/usdc-payment-form'
import PurchaseProductStatus from '@/components/purchase-product-status/purchase-product-status'
import { useProductUnifiedPaymentContext } from '@/contexts/product-unified-payment-context'
import { PurchaseStep } from '@/contexts/purchase-credits-context'
import { useSecondaryMarketplaceFlag } from '@/hooks/use-secondary-marketplace-flag'
import { PurchasableStatus } from '@/utils/get-purchasable-status'
import { urlFor, urls } from '@/utils/urls'

export interface PurchaseCollectibleUnifiedTemplateProps {
  assetId: number
  isPurchasable: boolean
  purchasableStatus: PurchasableStatus
}

export function PurchaseCollectibleUnifiedTemplate({
  assetId,
  isPurchasable,
  purchasableStatus,
}: PurchaseCollectibleUnifiedTemplateProps) {
  const { t } = useTranslation()
  const { push } = useRouter()
  const secondaryMarketplaceEnabled = useSecondaryMarketplaceFlag()

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
    setStep,
    status,
    step,
    reset,
  } = useProductUnifiedPaymentContext()

  const handleSuccessAction = useCallback(() => {
    push(urls.myCollectibles)
  }, [push])

  return (
    <>
      {!isPurchasable && (
        <div className={css.contentPadding}>
          {t(`nft:purchase.${purchasableStatus}`)}
          <LinkButton
            href={urlFor(urls.nftDetails, {
              assetId,
            })}
            fullWidth
          >
            {t('common:actions.Back To Collectible')}
          </LinkButton>
        </div>
      )}

      {isPurchasable && (
        <>
          {!secondaryMarketplaceEnabled ? (
            <div className={css.contentPadding}>
              <p>{t('nft:purchase.body')}</p>
              {/* TODO: update href */}
              <LinkButton href="/" fullWidth disabled>
                {t(`nft:purchase.purchaseComingSoon`)}
              </LinkButton>
            </div>
          ) : (
            <>
              {!purchasedProductId && product?.price && (
                <>
                  {/* Paying with cc */}
                  {step === PurchaseStep.form && (
                    <CcPaymentForm
                      amount={product.price}
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
                  {step === PurchaseStep.walletConnect && product?.price && (
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
            </>
          )}
        </>
      )}

      {/* Status of purchase*/}
      {!!purchasedProductId && (
        <PurchaseProductStatus
          loadingText={loadingText}
          status={status}
          handleSuccessAction={handleSuccessAction}
          handleRetry={reset}
          successActionLabel={t('common:actions.View In My Collection')}
        />
      )}
    </>
  )
}
