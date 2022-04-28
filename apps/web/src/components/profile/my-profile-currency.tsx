import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import common from './my-profile-common.module.css'
import css from './my-profile-language.module.css'

import { Currency } from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import { useCurrency } from '@/contexts/currency-context'

export default function MyProfileCurrency() {
  const { currency, setCurrency } = useCurrency()
  const [error, setError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const { t } = useTranslation()

  const handleCurrencyChange = (currency) => {
    setCurrency(currency).then((success) => {
      if (success) {
        setError('')
        setUpdateSuccess(true)
        setTimeout(() => setUpdateSuccess(false), 3000)
      } else {
        setError(t('common:statuses.An Error has Occurred'))
      }
    })
  }

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.currencies.label')}
        </Heading>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetCurrencyConfirmation')}
          </div>
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
