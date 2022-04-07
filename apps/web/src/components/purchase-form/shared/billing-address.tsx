import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from './card-details.module.css'

import Heading from '@/components/heading'
import Select, { SelectOption } from '@/components/select-input/select-input'
import TextInput from '@/components/text-input/text-input'

export interface BillingAddressProps {
  countries: SelectOption[]
  formErrors?: {
    address1?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  initialValues?: {
    address1?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
}

export default function BillingAddress({
  countries,
  formErrors,
  initialValues,
}: BillingAddressProps) {
  const { t } = useTranslation()
  return (
    <div className={clsx(css.formSection, css.formSectionNoMargin)}>
      <Heading level={2}>{t('forms:sections.Billing Address')}</Heading>

      <TextInput
        error={formErrors?.address1}
        label={t('forms:fields.address1.label')}
        name="address1"
        placeholder="123 Main Street"
        variant="small"
        value={initialValues?.address1}
      />
      <div className={css.formMultiRow}>
        <TextInput
          error={formErrors?.city}
          label={t('forms:fields.city.label')}
          name="city"
          placeholder="Boston"
          variant="small"
          value={initialValues?.city}
        />
        <TextInput
          error={formErrors?.state}
          label={t('forms:fields.state.label')}
          name="state"
          placeholder="MA"
          variant="small"
          value={initialValues?.state}
        />
      </div>
      <div className={css.formMultiRow}>
        {countries.length > 0 && (
          <Select
            error={formErrors?.country}
            label={t('forms:fields.country.label')}
            id="country"
            name="country"
            options={countries}
            placeholder="US"
          />
        )}
        <TextInput
          error={formErrors?.zipCode}
          label={t('forms:fields.zipCode.label')}
          name="zipCode"
          placeholder="02118"
          variant="small"
          value={initialValues?.zipCode}
        />
      </div>
    </div>
  )
}
