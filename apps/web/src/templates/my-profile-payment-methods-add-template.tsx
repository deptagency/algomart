import { useRouter } from 'next/router'
import { FormEvent, useCallback, useState } from 'react'

import common from '@/components/profile/my-profile-common.module.css'

import Async from '@/components/async/async'
import AddMethodsError from '@/components/payment-form/add-methods/add-methods-error'
import AddMethodsForm from '@/components/payment-form/add-methods/add-methods-form'
import { usePurchaseCreditsContext } from '@/contexts/purchase-credits-context'
import { CheckoutService } from '@/services/checkout-service'
import { urls } from '@/utils/urls'

export default function MyProfilePaymentMethodsAddTemplate() {
  const { handleAddCard: addCard } = usePurchaseCreditsContext()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const { push } = useRouter()

  const handleAddCard = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      try {
        setSubmitting(true)
        const data = new FormData(event.currentTarget)
        const publicKeyRecord = await CheckoutService.instance.getPublicKey()
        const cardId = await addCard(data, publicKeyRecord, true)
        if (cardId) {
          push(urls.myProfilePaymentMethods)
        }
      } catch (error) {
        setError(error)
      } finally {
        setSubmitting(false)
      }
    },
    [addCard, push]
  )

  return (
    <div className={common.sectionContent}>
      <div className={error ? 'hidden' : 'block'}>
        <Async isLoading={submitting}>
          <AddMethodsForm onSubmit={handleAddCard} />
        </Async>
      </div>
      <div className={error ? 'block' : 'hidden'}>
        <AddMethodsError handleRetry={() => setError(null)} />
      </div>
    </div>
  )
}
