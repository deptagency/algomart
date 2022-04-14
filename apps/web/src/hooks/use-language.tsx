import { DEFAULT_LANG, LANG_COOKIE } from '@algomart/schemas'
import { SUPPORTED_LANGUAGES } from '@algomart/schemas'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { getCookie } from '@/utils/cookies-web'

function getSupportedLanguage(lang: string) {
  // if your language is supported, return
  // otherwise check if your language without country is supported
  // otherwise default to english

  if (SUPPORTED_LANGUAGES.includes(lang)) return lang
  const [langPrefix] = lang.split('-')
  return SUPPORTED_LANGUAGES.includes(langPrefix) ? langPrefix : DEFAULT_LANG
}

export function useLanguage() {
  const router = useRouter()
  const auth = useAuth(false)
  const fallbackLanguage = useMemo(() => {
    return (
      auth?.user?.language ||
      router?.locale ||
      (typeof navigator !== 'undefined' && navigator.language) ||
      DEFAULT_LANG
    )
  }, [auth?.user?.language, router?.locale])

  const [language, setLanguage] = useState(
    getSupportedLanguage(fallbackLanguage)
  )

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

  return language
}
