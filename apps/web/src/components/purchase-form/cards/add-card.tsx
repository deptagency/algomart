import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent } from 'react'

import AddMethodsError from './sections/add-methods-error'
import AddMethodsForm from './sections/add-methods-form'
import AddMethodsSuccess from './sections/add-methods-success'

import Loading from '@/components/loading/loading'
import { usePaymentContext } from '@/contexts/payment-context'

export interface PaymentMethodsFormProps {
  onSubmit(event: FormEvent<HTMLFormElement>): void
}

export default function PaymentMethodsForm({
  onSubmit,
}: PaymentMethodsFormProps) {
  const { handleRetry, loadingText, status } = usePaymentContext()
  return (
    <section className="pt-5">
      <div className={status === CheckoutStatus.form ? '' : 'hidden'}>
        <AddMethodsForm onSubmit={onSubmit} />
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
