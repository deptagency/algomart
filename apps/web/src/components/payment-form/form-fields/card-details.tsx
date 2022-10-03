import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from '../cc-payment-form.module.css'

import CreditCardNetworkLogo from '@/components/credit-card-network-logo/credit-card-network-logo'
import FormField from '@/components/form-field'
import InputField from '@/components/input-field'

export interface CardDetailsProps {
  getError: (field: string) => string
}

export default function CardDetails({ getError }: CardDetailsProps) {
  const { t } = useTranslation()

  const [ccValue, setCCValue] = useState('')

  return (
    <>
      <InputField
        error={getError('ccNumber')}
        onChange={(v) => setCCValue(v.replace(/\D/g, ''))}
        endAdornment={
          <div className={css.ccNetworks}>
            <CreditCardNetworkLogo network="visa" />
            <CreditCardNetworkLogo network="mastercard" />
          </div>
        }
        label={t('forms:fields.ccNumber.label')}
        maxLength={20}
        name="ccNumber"
        value={ccValue}
      />

      <div className={css.formMultiRow}>
        <FormField
          htmlFor="expMonth"
          label={t('forms:fields.expirationDate.label')}
        >
          <div className={css.formMultiRow}>
            <InputField
              noMargin
              error={getError('expMonth')}
              maxLength={2}
              name="expMonth"
              placeholder="MM"
            />
            <InputField
              noMargin
              error={getError('expYear')}
              maxLength={2}
              name="expYear"
              placeholder="YY"
            />
          </div>
        </FormField>
        <InputField
          error={getError('securityCode')}
          label={t('forms:fields.securityCode.label')}
          maxLength={3}
          name="securityCode"
          placeholder="123"
        />
      </div>
    </>
  )
}
