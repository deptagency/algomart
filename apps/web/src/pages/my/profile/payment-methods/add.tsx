import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback } from 'react'

import { usePaymentProvider } from '@/contexts/payment-context'
import MyProfileLayout from '@/layouts/my-profile-layout'
import MyProfilePaymentMethodsAddTemplate from '@/templates/my-profile-payment-methods-add-template'

export default function MyProfilePaymentMethodsAddPage() {
  const { t } = useTranslation()
  const {
    countries,
    formErrors,
    handleRetry,
    handleSubmitPurchase,
    loadingText,
    status,
  } = usePaymentProvider({})

  const handleAddCard = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const data = new FormData(event.currentTarget)
      const isPurchase = false
      handleSubmitPurchase(data, isPurchase)
    },
    [handleSubmitPurchase]
  )

  return (
    <MyProfileLayout pageTitle={t('common:pageTitles.Add Payment Method')}>
      <MyProfilePaymentMethodsAddTemplate
        countries={countries}
        formErrors={formErrors}
        handleRetry={handleRetry}
        loadingText={loadingText}
        onSubmit={handleAddCard}
        status={status}
      />
    </MyProfileLayout>
  )
}
