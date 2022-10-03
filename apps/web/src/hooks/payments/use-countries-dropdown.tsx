import { Countries } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { SetStateAction, useCallback, useMemo, useState } from 'react'

import { FormValidation } from './use-payment-flow'

import { FilterableSelectOption } from '@/components/filterable-select'
import { useLanguage } from '@/contexts/language-context'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export interface useCountriesDropdownProps {
  formErrors: FormValidation
  setFormErrors: (value: SetStateAction<FormValidation & unknown>) => void
}

export function useCountriesDropdown({
  formErrors,
  setFormErrors,
}: useCountriesDropdownProps): {
  countries: FilterableSelectOption[]
  handleSelectedCountryChange: (countryCode: string) => void
  selectedCountry: FilterableSelectOption
} {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [selectedCountry, setSelectedCountry] =
    useState<FilterableSelectOption>()

  const { data } = useAPI<Countries>(
    ['countries'],
    urlFor(urls.api.application.countries, null, { language })
  )

  const countries = useMemo(() => {
    if (data) {
      const defaultOption = {
        label: t('forms:fields.country.defaultText'),
        value: '',
      }
      const selectOptions = data.map(({ code, flagEmoji, name }) => ({
        label: `${flagEmoji} ${name}`,
        value: code,
      }))

      setSelectedCountry(defaultOption)
      return [defaultOption, ...selectOptions]
    } else {
      return []
    }
  }, [data, t])

  /**
   * - Set selected country
   * - Unset form errors
   */
  const handleSelectedCountryChange = useCallback(
    (countryCode: string) => {
      setSelectedCountry(countries.find((c) => c.value === countryCode))
      setFormErrors({
        ...formErrors,
        address1: null,
        city: null,
        country: null,
        state: null,
      })
    },
    [countries, formErrors, setFormErrors]
  )

  return {
    countries,
    handleSelectedCountryChange,
    selectedCountry,
  }
}
