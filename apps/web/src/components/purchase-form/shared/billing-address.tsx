import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './card-details.module.css'

import Heading from '@/components/heading'
import Select from '@/components/select/select'
import TextInput from '@/components/text-input/text-input'
import { usePaymentContext } from '@/contexts/payment-context'

export default function BillingAddress() {
  const { t } = useTranslation()
  const { countries, getError } = usePaymentContext()
  return (
    <div className={clsx(css.formSection, css.formSectionNoMargin)}>
      <Heading level={2}>{t('forms:sections.Billing Address')}</Heading>

      <TextInput
        error={getError('address1')}
        label={t('forms:fields.address1.label')}
        name="address1"
        placeholder="123 Main Street"
        variant="small"
      />
      <div className={css.formMultiRow}>
        <TextInput
          error={getError('city')}
          label={t('forms:fields.city.label')}
          name="city"
          placeholder="Boston"
          variant="small"
        />
        <TextInput
          error={getError('state')}
          label={t('forms:fields.state.label')}
          name="state"
          placeholder="MA"
          variant="small"
        />
      </div>
      <div className={css.formMultiRow}>
        {countries.length > 0 && (
          <Select
            error={getError('country')}
            label={t('forms:fields.country.label')}
            id="country"
            name="country"
            options={countries}
            placeholder="US"
          />
        )}
        <TextInput
          error={getError('zipCode')}
          label={t('forms:fields.zipCode.label')}
          name="zipCode"
          placeholder="02118"
          variant="small"
        />
      </div>
    </div>
  )
}
