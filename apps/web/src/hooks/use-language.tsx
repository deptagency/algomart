import { DEFAULT_LANG, LANG_COOKIE } from '@algomart/schemas'
import { SUPPORTED_LANGUAGES } from '@algomart/schemas'
import { useRouter } from 'next/router'

import { useAuth } from '@/contexts/auth-context'
import { getCookie } from '@/utils/cookies-web'
export function useLanguage() {
  const router = useRouter()
  const auth = useAuth(false)
  const cookie = getCookie(LANG_COOKIE)
  const parsedCookie = cookie && cookie !== 'null' ? cookie : null

  // 1st cookie
  // 2nd user config
  // 3rd router locale
  // 4th browser language
  // 5th english
  const lang =
    parsedCookie ||
    auth?.user?.language ||
    router?.locale ||
    navigator?.language ||
    DEFAULT_LANG

  // if your language is supported, return
  // otherwise check if your language without country is supported
  // otherwise default to english
  if (SUPPORTED_LANGUAGES.includes(lang)) {
    return lang
  } else if (SUPPORTED_LANGUAGES.includes(lang.split('-')[0])) {
    return lang.split('-')[0]
  } else {
    return DEFAULT_LANG
  }
}
