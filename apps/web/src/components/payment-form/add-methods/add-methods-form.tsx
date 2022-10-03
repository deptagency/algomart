import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './add-methods-form.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import { H2 } from '@/components/heading'
import BillingAddress from '@/components/payment-form/form-fields/billing-address'
import CardDetails from '@/components/payment-form/form-fields/card-details'
import FullName from '@/components/payment-form/form-fields/full-name'
import { usePurchaseCreditsContext } from '@/contexts/purchase-credits-context'

export interface AddMethodsFormProps {
  onSubmit(event: FormEvent<HTMLFormElement>): void
}

export default function AddMethodsForm({ onSubmit }: AddMethodsFormProps) {
  const { t } = useTranslation()
  const { countries, getError, handleSelectedCountryChange, selectedCountry } =
    usePurchaseCreditsContext()

  return (
    <form className={css.form} onSubmit={onSubmit}>
      {getError('expirationDate') ? (
        <AlertMessage
          className={css.notification}
          content={getError('expirationDate')}
          variant="red"
        />
      ) : null}
      <H2>{t('forms:sections.Credit Card')}</H2>
      <FullName
        formErrors={{
          firstName: getError('firstName'),
          lastName: getError('lastName'),
        }}
      />
      <CardDetails getError={getError} />
      <BillingAddress
        countries={countries}
        getError={getError}
        handleSelectedCountryChange={handleSelectedCountryChange}
        selectedCountry={selectedCountry}
      />
      {/* Submit */}
      <Button fullWidth type="submit" className={css.submitButton}>
        {t('common:actions.Add Card')}
      </Button>
    </form>
  )
}
