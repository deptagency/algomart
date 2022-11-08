import { CheckoutStatus } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React, { FormEvent, useCallback } from 'react'

import PurchaseProductStatus from '@/components/purchase-product-status/purchase-product-status'
import PurchaseWithCreditsForm from '@/components/purchase-with-credits/purchase-with-credits-form'
import { useAuth } from '@/contexts/auth-context'
import { useProductCreditsPaymentContext } from '@/contexts/product-credits-payment-context'
import { urlFor, urls } from '@/utils/urls'

export function PurchasePackCreditsTemplate() {
  const { t } = useTranslation()
  const { push } = useRouter()
  const { user } = useAuth()

  const {
    handleSubmitPayment,
    loadingText,
    purchasedProductId,
    product,
    setPurchasedProductId,
    setStatus,
    status,
  } = useProductCreditsPaymentContext()

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await handleSubmitPayment()
    },
    [handleSubmitPayment]
  )

  const handleRetry = useCallback(() => {
    setPurchasedProductId(null)
    setStatus(CheckoutStatus.form)
  }, [setPurchasedProductId, setStatus])

  const handlePurchasePackSuccess = useCallback(() => {
    push(urlFor(urls.packOpening, { packId: purchasedProductId }))
  }, [push, purchasedProductId])

  return (
    <>
      {/* Is paying with credits */}
      {!purchasedProductId &&
        product?.price &&
        status === CheckoutStatus.form && (
          <PurchaseWithCreditsForm
            handleSubmit={handleSubmit}
            balance={user?.balance}
            buyLabel={t('forms:fields.payWithBalance.buyPack')}
            price={product?.price}
          />
        )}

      {/* Status of purchase*/}
      <PurchaseProductStatus
        loadingText={loadingText}
        status={status}
        handleSuccessAction={handlePurchasePackSuccess}
        handleRetry={handleRetry}
        successActionLabel={t('common:actions.Open Pack')}
      ></PurchaseProductStatus>
    </>
  )
}
