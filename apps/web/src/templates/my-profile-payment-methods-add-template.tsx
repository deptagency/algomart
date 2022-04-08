import { FormEvent, useCallback } from 'react'

import common from '@/components/profile/my-profile-common.module.css'

import PaymentMethodsForm from '@/components/purchase-form/cards/add-card'
import { usePaymentContext } from '@/contexts/payment-context'

export default function MyProfilePaymentMethodsAddTemplate() {
  const { handleSubmitPurchase } = usePaymentContext()

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
    <div className={common.sectionContent}>
      <PaymentMethodsForm onSubmit={handleAddCard} />
    </div>
  )
}
