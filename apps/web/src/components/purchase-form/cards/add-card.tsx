import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent } from 'react'

import AddMethodsError from './sections/add-methods-error'
import AddMethodsForm from './sections/add-methods-form'
import AddMethodsSuccess from './sections/add-methods-success'

import Loading from '@/components/loading/loading'
import { SelectOption } from '@/components/select-input/select-input'
import { FormValidation } from '@/contexts/payment-context'

export interface PaymentMethodsFormProps {
  countries: SelectOption[]
  formErrors?: FormValidation
  handleRetry: () => void
  loadingText: string
  onSubmit(event: FormEvent<HTMLFormElement>): void
  status?: CheckoutStatus
}

export default function PaymentMethodsForm({
  countries,
  handleRetry,
  formErrors,
  loadingText,
  onSubmit,
  status,
}: PaymentMethodsFormProps) {
  return (
    <section className="pt-5">
      <div className={status === CheckoutStatus.form ? '' : 'hidden'}>
        <AddMethodsForm
          countries={countries}
          formErrors={formErrors}
          onSubmit={onSubmit}
        />
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
