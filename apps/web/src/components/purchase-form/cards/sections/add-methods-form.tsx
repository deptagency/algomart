import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './add-methods-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import Heading from '@/components/heading'
import BillingAddress from '@/components/purchase-form/shared/billing-address'
import CardDetails from '@/components/purchase-form/shared/card-details'
import FullName from '@/components/purchase-form/shared/full-name'
import { FormValidation } from '@/contexts/payment-context'

export interface AddMethodsFormProps {
  formErrors?: FormValidation
  onSubmit(event: FormEvent<HTMLFormElement>): void
}

export default function AddMethodsForm({
  formErrors,
  onSubmit,
}: AddMethodsFormProps) {
  const { t } = useTranslation()
  return (
    <form className={css.form} onSubmit={onSubmit}>
      {formErrors && 'expirationDate' in formErrors && (
        <AlertMessage
          className={css.notification}
          content={formErrors.expirationDate}
          variant="red"
        />
      )}
      <Heading level={2}>{t('forms:sections.Credit Card')}</Heading>
      <FullName
        formErrors={{
          fullName:
            formErrors && 'fullName' in formErrors
              ? (formErrors.fullName as string)
              : '',
        }}
      />
      <CardDetails
        formErrors={{
          ccNumber:
            formErrors && 'ccNumber' in formErrors
              ? (formErrors.ccNumber as string)
              : '',
          expMonth:
            formErrors && 'expMonth' in formErrors
              ? (formErrors.expMonth as string)
              : '',
          expYear:
            formErrors && 'expYear' in formErrors
              ? (formErrors.expYear as string)
              : '',
          securityCode:
            formErrors && 'securityCode' in formErrors
              ? (formErrors.securityCode as string)
              : '',
        }}
      />
      <BillingAddress
        formErrors={{
          address1:
            formErrors && 'address1' in formErrors
              ? (formErrors.address1 as string)
              : '',
          city:
            formErrors && 'city' in formErrors
              ? (formErrors.city as string)
              : '',
          state:
            formErrors && 'state' in formErrors
              ? (formErrors.state as string)
              : '',
          country:
            formErrors && 'country' in formErrors
              ? (formErrors.country as string)
              : '',
          zipCode:
            formErrors && 'zipCode' in formErrors
              ? (formErrors.zipCode as string)
              : '',
        }}
      />
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
