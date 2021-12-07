import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent } from 'react'

import common from '@/components/profile/my-profile-common.module.css'

import PaymentMethodsForm from '@/components/payment-methods-form'
import { FormValidation } from '@/contexts/payment-context'

export interface MyProfilePaymentMethodsAddProps {
  formErrors?: FormValidation
  loadingText: string
  onSubmit(event: FormEvent<HTMLFormElement>): void
  status?: CheckoutStatus
  setStatus: (status: CheckoutStatus) => void
}

export default function MyProfilePaymentMethodsAddTemplate({
  formErrors,
  loadingText,
  onSubmit,
  setStatus,
  status,
}: MyProfilePaymentMethodsAddProps) {
  return (
    <div className={common.sectionContent}>
      <PaymentMethodsForm
        formErrors={formErrors}
        loadingText={loadingText}
        onSubmit={onSubmit}
        setStatus={setStatus}
        status={status}
      />
    </div>
  )
}
