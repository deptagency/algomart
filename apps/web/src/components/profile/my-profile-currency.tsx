import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import { MyProfilePersonalSettingsSectionProps } from './my-profile-personal-settings'

import css from './my-profile-personal-settings.module.css'

import { Currency } from '@/components/auth-inputs/auth-inputs'
import { useCurrency } from '@/contexts/currency-context'

export default function MyProfileCurrency({
  onUpdateSuccess,
  onError,
}: MyProfilePersonalSettingsSectionProps) {
  const { currency, updateCurrency } = useCurrency()
  const { t } = useTranslation()

  const handleCurrencyChange = useCallback(
    (currency) => {
      onError('')
      onUpdateSuccess('')
      updateCurrency(currency).then((success) => {
        if (success) {
          onError('')
          onUpdateSuccess(t('profile:resetCurrencyConfirmation'))
        } else {
          onError(t('common:statuses.An Error has Occurred'))
        }
      })
    },
    [onError, onUpdateSuccess, t, updateCurrency]
  )

  return (
    <div className={css.inputWrapper} data-e2e="profile-currency">
      <Currency
        noMargin
        label=""
        value={currency}
        onChange={(option) => handleCurrencyChange(option)}
      />
      {t('profile:Local Currency')}
    </div>
  )
}
