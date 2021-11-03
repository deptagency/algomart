import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent } from 'react'
import { ExtractError } from 'validator-fns'

import common from '@/components/profile/my-profile-common.module.css'

import PaymentMethodsForm from '@/components/payment-methods-form'
import {
  validateExpirationDate,
  validatePurchaseForm,
} from '@/utils/purchase-validation'

export interface MyProfilePaymentMethodsAddProps {
  formErrors?: ExtractError<
    ReturnType<typeof validatePurchaseForm | typeof validateExpirationDate>
  >
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
