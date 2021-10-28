import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'
import { ExtractError } from 'validator-fns'

import css from './add-methods-form.module.css'

import Button from '@/components/button'
import CardDetails from '@/components/card-details'
import BillingAddress from '@/components/card-details/billing-address'
import Heading from '@/components/heading'
import Notification from '@/components/notification/notification'
import {
  validateExpirationDate,
  validatePurchaseForm,
} from '@/utils/purchase-validation'

export interface AddMethodsFormProps {
  formErrors?: ExtractError<
    ReturnType<typeof validatePurchaseForm | typeof validateExpirationDate>
  >
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
        <Notification
          className={css.notification}
          content={formErrors.expirationDate}
          variant="red"
        />
      )}
      <Heading level={2}>{t('forms:sections.Credit Card')}</Heading>
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
          fullName:
            formErrors && 'fullName' in formErrors
              ? (formErrors.fullName as string)
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
