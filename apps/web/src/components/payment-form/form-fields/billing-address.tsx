import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'

import css from '../cc-payment-form.module.css'

import FilterableSelect, {
  FilterableSelectOption,
} from '@/components/filterable-select'
import { H2 } from '@/components/heading'
import InputField from '@/components/input-field'

export interface BillingAddressProps {
  countries: FilterableSelectOption[]
  getError: (field: string) => string
  handleSelectedCountryChange: (countryCode: string) => void
  selectedCountry: FilterableSelectOption
}

export default function BillingAddress({
  countries,
  getError,
  handleSelectedCountryChange,
  selectedCountry,
}: BillingAddressProps) {
  const { t } = useTranslation()

  return (
    <div className={clsx(css.formSection, css.formSectionNoMargin)}>
      <H2>{t('forms:sections.Billing Address')}</H2>

      {countries?.length > 0 && (
        <FilterableSelect
          className={css.select}
          error={getError('country')}
          label={t('forms:fields.country.label')}
          id="country"
          name="country"
          options={countries}
          onChange={(value) => handleSelectedCountryChange(value)}
          value={selectedCountry?.value}
        />
      )}
      {selectedCountry?.value && (
        <>
          <InputField
            error={getError('address1')}
            label={t('forms:fields.address1.label')}
            name="address1"
            placeholder="123 Main Street"
          />
          <InputField
            error={getError('city')}
            label={t('forms:fields.city.label')}
            name="city"
            placeholder="Boston"
          />
          <div className={css.formMultiRow}>
            {(selectedCountry.value === 'US' ||
              selectedCountry.value === 'CA') && (
              <InputField
                error={getError('state')}
                errorVariant="full-width"
                label={t('forms:fields.state.label')}
                name="state"
                placeholder="MA"
                maxLength={2}
              />
            )}
            <InputField
              error={getError('zipCode')}
              label={t('forms:fields.zipCode.label')}
              name="zipCode"
              placeholder="02118"
            />
          </div>
        </>
      )}
    </div>
  )
}
