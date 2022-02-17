import { DEFAULT_LOCALE, LOCALE_COOKIE } from '@algomart/schemas'
import { useRouter } from 'next/router'

import { useAuth } from '@/contexts/auth-context'
import { getCookie } from '@/utils/cookies-web'

export function useLocale() {
  const router = useRouter()
  const auth = useAuth(false)
  const cookie = getCookie(LOCALE_COOKIE)
  const parsedCookie = cookie && cookie !== 'null' ? cookie : null

  // 1st cookie
  // 2nd user config
  // 3rd browser language / router locale
  // 4th english
  return parsedCookie || auth?.user?.locale || router?.locale || DEFAULT_LOCALE
}
