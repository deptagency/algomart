import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent } from 'react'

import common from '@/components/profile/my-profile-common.module.css'

import PaymentMethodsForm from '@/components/purchase-form/cards/add-card'
import { FormValidation } from '@/contexts/payment-context'

export interface MyProfilePaymentMethodsAddProps {
  formErrors?: FormValidation
  handleRetry: () => void
  loadingText: string
  onSubmit(event: FormEvent<HTMLFormElement>): void
  status?: CheckoutStatus
}

export default function MyProfilePaymentMethodsAddTemplate({
  handleRetry,
  formErrors,
  loadingText,
  onSubmit,
  status,
}: MyProfilePaymentMethodsAddProps) {
  return (
    <div className={common.sectionContent}>
      <PaymentMethodsForm
        formErrors={formErrors}
        handleRetry={handleRetry}
        loadingText={loadingText}
        onSubmit={onSubmit}
        status={status}
      />
    </div>
  )
}
