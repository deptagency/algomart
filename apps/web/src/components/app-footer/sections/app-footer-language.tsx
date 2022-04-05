import { LANG_COOKIE } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { Language } from '@/components/auth-inputs/auth-inputs'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/hooks/use-language'
import { AuthService } from '@/services/auth-service'
import { validateLanguage } from '@/utils/auth-validation'
import { setCookie } from '@/utils/cookies-web'

export default function AppFooterLanguage() {
  const { t } = useTranslation()
  const router = useRouter()
  const language = useLanguage()
  const { user, reloadProfile } = useAuth()
  const [dropdownLanguage, setDropdownLanguage] = useState<string>(
    useLanguage()
  )
  const [loading, setLoading] = useState<boolean>(false)

  const validate = useMemo(() => validateLanguage(), [])

  // callback to handle dropdown changes
  const handleDropdownLanguageChange = useCallback(
    async (language: string) => {
      setLoading(true)

      // Validate form body
      const body = {
        language: language,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setLoading(false)
        return
      }

      setCookie(LANG_COOKIE, language, 365)

      if (user) {
        // Update language
        const updateLanguage = await AuthService.instance.updateLanguage(
          body.language
        )
        if (!updateLanguage) {
          setLoading(false)
          return
        }

        await reloadProfile()
      }

      setLoading(false)
      setDropdownLanguage(language)
      router.push(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale: language }
      )
      return
    },
    [validate, user, router, reloadProfile]
  )

  // useEffect to handle global locale changes
  useEffect(() => {
    setDropdownLanguage(language)
  }, [language])

  return (
    <Language
      disabled={loading}
      showLabel={false}
      value={dropdownLanguage}
      onChange={handleDropdownLanguageChange}
    />
  )
}
