import { DEFAULT_LANG, LANG_COOKIE, RTL_LANGUAGES } from '@algomart/schemas'
import { SUPPORTED_LANGUAGES } from '@algomart/schemas'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { AuthService } from '@/services/auth-service'
import { getCookie, setLanguageCookie } from '@/utils/cookies-web'

interface ILanguageContext {
  language: string
  updateLanguage: (language: string) => Promise<boolean>
}

const LanguageContext = createContext<ILanguageContext>({
  language: DEFAULT_LANG,
  updateLanguage: () => Promise.resolve(true),
})

export const useLanguage = () => useContext(LanguageContext)

function getSupportedLanguage(lang: string) {
  // if your language is supported, return
  // otherwise check if your language without country is supported
  // otherwise default to english

  if (SUPPORTED_LANGUAGES.includes(lang)) return lang
  const [langPrefix] = lang.split('-')
  return SUPPORTED_LANGUAGES.includes(langPrefix) ? langPrefix : DEFAULT_LANG
}

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const router = useRouter()
  const auth = useAuth(false)
  const fallbackLanguage = useMemo(
    () =>
      auth?.user?.language ||
      router?.locale ||
      (typeof navigator !== 'undefined' && navigator.language) ||
      DEFAULT_LANG,
    [auth?.user?.language, router?.locale]
  )

  const [language, setLanguage] = useState(
    getSupportedLanguage(fallbackLanguage)
  )

  const updateLanguage = async (language: string) => {
    setLanguage(language)
    setLanguageCookie(language)
    if (auth?.user) {
      const success = await AuthService.instance.updateLanguage(language)
      await auth.reloadProfile()
      return success
    }
    return true
  }

  useEffect(() => {
    router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: language }
    )
  }, [language]) /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    document.documentElement.dir = RTL_LANGUAGES.includes(
      language.split('-')[0]
    )
      ? 'rtl'
      : 'ltr'
  }, [language])

  useEffect(() => {
    const cookie = getCookie(LANG_COOKIE)
    const parsedCookie = cookie && cookie !== 'null' ? cookie : null

    // 1st cookie
    // 2nd user config
    // 3rd router locale
    // 4th browser language
    // 5th english
    setLanguage(getSupportedLanguage(parsedCookie || fallbackLanguage))
  }, [fallbackLanguage])

  const value = {
    language,
    updateLanguage,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
