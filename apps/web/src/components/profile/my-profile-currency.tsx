import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import common from './my-profile-common.module.css'
import css from './my-profile-language.module.css'

import { Currency } from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import { useCurrency } from '@/contexts/currency-context'

export default function MyProfileCurrency() {
  const { currency, updateCurrency } = useCurrency()
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { t } = useTranslation()

  const handleCurrencyChange = useCallback(
    (currency) => {
      setError('')
      setSuccessMessage('')
      updateCurrency(currency).then((success) => {
        if (success) {
          setError('')
          setSuccessMessage(t('profile:resetCurrencyConfirmation'))
          setTimeout(() => setSuccessMessage(''), 3000)
        } else {
          setError(t('common:statuses.An Error has Occurred'))
        }
      })
    },
    [t]
  )

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.currencies.label')}
        </Heading>
        {successMessage && (
          <div className={common.confirmation}>{successMessage}</div>
        )}
        {error && <div className={common.error}>{error}</div>}
      </div>
      <div className={common.sectionContent}>
        <div className={css.inputWrapper}>
          <Currency
            showLabel={false}
            value={currency}
            onChange={handleCurrencyChange}
          />
        </div>
      </div>
    </section>
  )
}
