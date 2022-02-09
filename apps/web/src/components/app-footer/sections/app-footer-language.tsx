import { LOCALE_COOKIE } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback, useMemo, useState } from 'react'

import { Language } from '@/components/auth-inputs/auth-inputs'
import { SelectOption } from '@/components/select/select'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/hooks/use-locale'
import authService from '@/services/auth-service'
import { validateLanguage } from '@/utils/auth-validation'
import { setCookie } from '@/utils/cookies-web'

export default function AppFooterLanguage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, reloadProfile } = useAuth()
  const [language, setLanguage] = useState<string>(useLocale())
  const [loading, setLoading] = useState<boolean>(false)

  const validate = useMemo(() => validateLanguage(t), [t])

  const handleLanguageChange = useCallback(
    async (selectedOption: SelectOption) => {
      const locale = selectedOption?.id

      setLoading(true)

      // Validate form body
      const body = {
        language: locale,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setLoading(false)
        return
      }

      setCookie(LOCALE_COOKIE, locale, 365)

      if (user) {
        // Update language
        const updateLanguage = await authService.updateLanguage(body.language)
        if (!updateLanguage) {
          setLoading(false)
          return
        }

        await reloadProfile()
      }

      setLoading(false)
      setLanguage(locale)
      router.push(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale }
      )
      return
    },
    [validate, user, router, reloadProfile]
  )

  return (
    <Language
      disabled={loading}
      showLabel={false}
      value={language}
      handleChange={handleLanguageChange}
      t={t}
    />
  )
}
