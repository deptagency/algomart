import { LANG_COOKIE } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import css from './my-profile-personal-settings.module.css'

import { Language } from '@/components/auth-inputs/auth-inputs'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/hooks/use-language'
import { AuthService } from '@/services/auth-service'
import { validateLanguage } from '@/utils/auth-validation'
import { setCookie } from '@/utils/cookies-web'

export default function MyProfileLanguage() {
  const language = useLanguage()
  const { reloadProfile } = useAuth()
  const [dropdownLanguage, setDropdownLanguage] = useState<string>(
    useLanguage()
  )
  const [loading, setLoading] = useState<boolean>(false)
  const { t } = useTranslation()
  const router = useRouter()

  const validate = useMemo(() => validateLanguage(), [])

  const handleUpdateLanguage = useCallback(
    async (_language) => {
      setLoading(true)

      // Validate form body
      const body = {
        language: _language,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setLoading(false)
        return
      }

      // Update language
      const updateLanguage = await AuthService.instance.updateLanguage(
        body.language
      )
      if (!updateLanguage) {
        setLoading(false)
        return
      }

      setCookie(LANG_COOKIE, body.language, 365)
      await reloadProfile()
      setLoading(false)
      setDropdownLanguage(body.language)

      await router.push(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale: body?.language }
      )

      return
    },
    [reloadProfile, validate, router]
  )

  useEffect(() => {
    setDropdownLanguage(language)
  }, [language])

  return (
    <div className={css.inputWrapper}>
      <Language
        className="mb-0"
        disabled={loading}
        showLabel={false}
        value={dropdownLanguage}
        handleChange={(language) => handleUpdateLanguage(language.id as string)}
        t={t}
      />
      {t('profile:Site Language')}
    </div>
  )
}
