import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Currency } from '@/components/auth-inputs/auth-inputs'
import { useAuth } from '@/contexts/auth-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLanguage } from '@/hooks/use-language'
import { AuthService } from '@/services/auth-service'
import { validateCurrency } from '@/utils/auth-validation'
import { setCurrencyCookie } from '@/utils/cookies-web'

export default function AppFooterCurrency() {
  const { t } = useTranslation()
  const { user, reloadProfile } = useAuth()
  const router = useRouter()
  const language = useLanguage()
  const currency = useCurrency()
  const [dropdownCurrency, setDropdownCurrency] = useState<string>(
    useCurrency()
  )
  const [loading, setLoading] = useState<boolean>(false)

  const validate = useMemo(() => validateCurrency(t), [t])

  // callback to handle dropdown changes
  const handleDropdownCurrencyChange = useCallback(
    async (currency: string) => {
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

      if (user) {
        // Update currency
        const updateCurrency = await AuthService.instance.updateCurrency(
          body.currency
        )
        if (!updateCurrency) {
          setLoading(false)
          return
        }

        await reloadProfile()
      } else {
        setCurrencyCookie(body.currency)

        // TODO: fix race condition to avoid having to do the router push when not logged in
        router.push(
          { pathname: router.pathname, query: router.query },
          router.asPath,
          { locale: language }
        )
      }

      setLoading(false)
      setDropdownCurrency(currency)

      return
    },
    [validate, user, router, language, reloadProfile]
  )

  // useEffect to handle global currency changes
  useEffect(() => {
    setDropdownCurrency(currency)
  }, [currency])

  return (
    <Currency
      disabled={loading}
      showLabel={false}
      value={dropdownCurrency}
      onChange={handleDropdownCurrencyChange}
    />
  )
}
