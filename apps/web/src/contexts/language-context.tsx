import {
  DEFAULT_LANG,
  LANG_COOKIE,
  SUPPORTED_LANGUAGES,
} from '@algomart/schemas'
import { useRouter } from 'next/router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useAuth } from '@/contexts/auth-context'
import { AuthService } from '@/services/auth-service'
import { safeGetCookie, setLanguageCookie } from '@/utils/cookies-web'

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

  return SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANG
}

function safeGetNavigatorLocale() {
  return typeof navigator !== 'undefined' ? navigator.language : null
}

export const LanguageProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const router = useRouter()
  const auth = useAuth(false)

  // 1st cookie
  // 2nd user config
  // 3rd router locale
  // 4th browser language
  // 5th english
  const fallbackLanguage = useMemo(
    () =>
      safeGetCookie(LANG_COOKIE) ||
      auth.user?.language ||
      router?.locale ||
      safeGetNavigatorLocale() ||
      DEFAULT_LANG,
    [auth.user?.language, router?.locale]
  )

  const [language, setLanguage] = useState(
    getSupportedLanguage(fallbackLanguage)
  )

  const updateLanguage = useCallback(
    async (language: string) => {
      setLanguage(language)
      setLanguageCookie(language)
      if (auth.user) {
        const success = await AuthService.instance.updateLanguage(language)
        await auth.reloadProfile()
        return success
      }
      return true
    },
    [auth]
  )

  useEffect(() => {
    // Redirect to updated language as needed
    if (router.locale === language) return
    router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: language }
    )
  }, [language, router])

  const value = useMemo(
    () => ({
      language,
      updateLanguage,
    }),
    [language, updateLanguage]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
