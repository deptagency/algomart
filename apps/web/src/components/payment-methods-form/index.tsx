import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent, useCallback } from 'react'

import AddMethodsError from './sections/add-methods-error'
import AddMethodsForm from './sections/add-methods-form'
import AddMethodsSuccess from './sections/add-methods-success'

import Loading from '@/components/loading/loading'
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
    <section className="pt-5">
      <div className={status === CheckoutStatus.form ? '' : 'hidden'}>
        <AddMethodsForm formErrors={formErrors} onSubmit={onSubmit} />
      </div>

      {status === CheckoutStatus.loading && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === CheckoutStatus.success && <AddMethodsSuccess />}

      {status === CheckoutStatus.error && (
        <AddMethodsError handleRetry={handleRetry} />
      )}
    </section>
  )
}
