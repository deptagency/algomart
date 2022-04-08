import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './add-methods-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import Heading from '@/components/heading'
import BillingAddress from '@/components/purchase-form/shared/billing-address'
import CardDetails from '@/components/purchase-form/shared/card-details'
import FullName from '@/components/purchase-form/shared/full-name'
import { usePaymentContext } from '@/contexts/payment-context'

export interface AddMethodsFormProps {
  onSubmit(event: FormEvent<HTMLFormElement>): void
}

export default function AddMethodsForm({ onSubmit }: AddMethodsFormProps) {
  const { t } = useTranslation()
  const { getError } = usePaymentContext()
  return (
    <form className={css.form} onSubmit={onSubmit}>
      {getError('expirationDate') ? (
        <AlertMessage
          className={css.notification}
          content={getError('expirationDate')}
          variant="red"
        />
      ) : null}
      <Heading level={2}>{t('forms:sections.Credit Card')}</Heading>
      <FullName formErrors={{ fullName: getError('fullName') }} />
      <CardDetails />
      <BillingAddress />
      {/* Submit */}
      <Button
        fullWidth
        type="submit"
        variant="primary"
        className={css.submitButton}
        size="small"
      >
        {t('common:actions.Add Card')}
      </Button>
    </form>
  )
}
