import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './add-methods-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import Heading from '@/components/heading'
import BillingAddress from '@/components/purchase-form/shared/billing-address'
import CardDetails from '@/components/purchase-form/shared/card-details'
import FullName from '@/components/purchase-form/shared/full-name'
import { SelectOption } from '@/components/select-input/select-input'
import { FormValidation, getError } from '@/contexts/payment-context'

export interface AddMethodsFormProps {
  countries: SelectOption[]
  formErrors?: FormValidation
  onSubmit(event: FormEvent<HTMLFormElement>): void
}

export default function AddMethodsForm({
  countries,
  formErrors,
  onSubmit,
}: AddMethodsFormProps) {
  const { t } = useTranslation()
  return (
    <form className={css.form} onSubmit={onSubmit}>
      {getError('expirationDate', formErrors) ? (
        <AlertMessage
          className={css.notification}
          content={getError('expirationDate', formErrors)}
          variant="red"
        />
      ) : null}
      <Heading level={2}>{t('forms:sections.Credit Card')}</Heading>
      <FullName formErrors={{ fullName: getError('fullName', formErrors) }} />
      <CardDetails
        formErrors={{
          ccNumber: getError('ccNumber', formErrors),
          expMonth: getError('expMonth', formErrors),
          expYear: getError('expYear', formErrors),
          securityCode: getError('securityCode', formErrors),
        }}
      />
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
