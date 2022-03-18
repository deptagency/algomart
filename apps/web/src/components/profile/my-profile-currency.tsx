import { CURRENCY_COOKIE } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useMemo, useState } from 'react'

import css from './my-profile-personal-settings.module.css'

import { Currency } from '@/components/auth-inputs/auth-inputs'
import { useAuth } from '@/contexts/auth-context'
import { useCurrency } from '@/hooks/use-currency'
import { AuthService } from '@/services/auth-service'
import { validateCurrency } from '@/utils/auth-validation'
import { setCookie } from '@/utils/cookies-web'

export default function MyProfileCurrency() {
  const { reloadProfile } = useAuth()
  const [currency, setCurrency] = useState<string>(useCurrency())
  const [loading, setLoading] = useState<boolean>(false)
  const { t } = useTranslation()

  const validate = useMemo(() => validateCurrency(t), [t])

  const handleCurrencyChange = useCallback(
    async (_currency: string) => {
      setLoading(true)

      // Validate form body
      const body = {
        currency: _currency,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setLoading(false)
        return
      }

      // Update currency
      const updateCurrency = await AuthService.instance.updateCurrency(
        body.currency
      )
      if (!updateCurrency) {
        setLoading(false)
        return
      }

      setCookie(CURRENCY_COOKIE, body.currency, 365)
      await reloadProfile()
      setLoading(false)
      setCurrency(body.currency)
      return
    },
    [reloadProfile, validate]
  )

  return (
    <div className={css.inputWrapper}>
      <Currency
        className="mb-0"
        disabled={loading}
        showLabel={false}
        value={currency}
        handleChange={(option) => handleCurrencyChange(option.id as string)}
        t={t}
      />
      {t('profile:Local Currency')}
    </div>
  )
}
