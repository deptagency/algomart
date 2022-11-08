import { CheckoutStatus } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback } from 'react'

import PurchaseProductStatus from '@/components/purchase-product-status/purchase-product-status'
import PurchaseWithCreditsForm from '@/components/purchase-with-credits/purchase-with-credits-form'
import { useAuth } from '@/contexts/auth-context'
import { useProductCreditsPaymentContext } from '@/contexts/product-credits-payment-context'
import { urls } from '@/utils/urls'

export function PurchaseCollectibleCreditsTemplate() {
  const { t } = useTranslation()
  const { push } = useRouter()
  const { user } = useAuth()

  const { handleSubmitPayment, loadingText, product, handleRetry, status } =
    useProductCreditsPaymentContext()

  const handleSuccessAction = useCallback(() => {
    push(urls.myCollectibles)
  }, [push])

  return (
    <>
      {/* Is paying with credits */}
      {product?.price && status === CheckoutStatus.form && (
        <PurchaseWithCreditsForm
          handleSubmit={handleSubmitPayment}
          balance={user?.balance}
          buyLabel={t('forms:fields.payWithBalance.buyCollectible')}
          price={product.price}
        />
      )}

      {/* Status of purchase*/}
      <PurchaseProductStatus
        loadingText={loadingText}
        status={status}
        handleSuccessAction={handleSuccessAction}
        handleRetry={handleRetry}
        successActionLabel={t('common:actions.View In My Collection')}
      ></PurchaseProductStatus>
    </>
  )
}
