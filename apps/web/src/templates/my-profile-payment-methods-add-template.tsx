import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent } from 'react'

import common from '@/components/profile/my-profile-common.module.css'

import PaymentMethodsForm from '@/components/purchase-form/cards/add-card'
import { SelectOption } from '@/components/select-input/select-input'
import { FormValidation } from '@/contexts/payment-context'

export interface MyProfilePaymentMethodsAddProps {
  countries: SelectOption[]
  formErrors?: FormValidation
  handleRetry: () => void
  loadingText: string
  onSubmit(event: FormEvent<HTMLFormElement>): void
  status?: CheckoutStatus
}

export default function MyProfilePaymentMethodsAddTemplate({
  countries,
  handleRetry,
  formErrors,
  loadingText,
  onSubmit,
  status,
}: MyProfilePaymentMethodsAddProps) {
  return (
    <div className={common.sectionContent}>
      <PaymentMethodsForm
        countries={countries}
        formErrors={formErrors}
        handleRetry={handleRetry}
        loadingText={loadingText}
        onSubmit={onSubmit}
        status={status}
      />
    </div>
  )
}
