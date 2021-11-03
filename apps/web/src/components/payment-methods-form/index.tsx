import { CheckoutStatus } from '@algomart/schemas'
import { FormEvent, useCallback } from 'react'
import { ExtractError } from 'validator-fns'

import AddMethodsError from './sections/add-methods-error'
import AddMethodsForm from './sections/add-methods-form'
import AddMethodsSuccess from './sections/add-methods-success'

import Loading from '@/components/loading/loading'
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
  const handleRetry = useCallback(() => {
    setStatus('form')
  }, [setStatus])

  return (
    <section className="pt-5">
      <div className={status === 'form' ? '' : 'hidden'}>
        <AddMethodsForm formErrors={formErrors} onSubmit={onSubmit} />
      </div>

      {status === 'loading' && (
        <Loading loadingText={loadingText} variant="primary" />
      )}

      {status === 'success' && <AddMethodsSuccess />}

      {status === 'error' && <AddMethodsError handleRetry={handleRetry} />}
    </section>
  )
}
