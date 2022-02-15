import { CURRENCY_COOKIE } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback, useMemo, useState } from 'react'

import { Currency } from '@/components/auth-inputs/auth-inputs'
import { SelectOption } from '@/components/select/select'
import { useAuth } from '@/contexts/auth-context'
import { useCurrency } from '@/hooks/use-currency'
import authService from '@/services/auth-service'
import { validateCurrency } from '@/utils/auth-validation'
import { setCookie } from '@/utils/cookies-web'

export default function AppFooterLanguage() {
  const { t } = useTranslation()
  const { user, reloadProfile } = useAuth()
  const [currency, setCurrency] = useState<string>(useCurrency())
  const [loading, setLoading] = useState<boolean>(false)

  const validate = useMemo(() => validateCurrency(t), [t])

  const handleCurrencyChange = useCallback(
    async (selectedOption: SelectOption) => {
      const currency = selectedOption?.id

      setLoading(true)

      // Validate form body
      const body = {
        currency,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setLoading(false)
        return
      }

      setCookie(CURRENCY_COOKIE, currency, 365)

      if (user) {
        // Update currency
        const updateCurrency = await authService.updateCurrency(body.currency)
        if (!updateCurrency) {
          setLoading(false)
          return
        }

        await reloadProfile()
      }

      setLoading(false)
      setCurrency(currency)

      return
    },
    [validate, user, reloadProfile]
  )

  return (
    <Currency
      disabled={loading}
      showLabel={false}
      value={currency}
      handleChange={handleCurrencyChange}
      t={t}
    />
  )
}
