import { CURRENCY_COOKIE, DEFAULT_CURRENCY } from '@algomart/schemas'

import { useAuth } from '@/contexts/auth-context'
import { getCookie } from '@/utils/cookies-web'

export function useCurrency() {
  const auth = useAuth(false)
  const cookie = getCookie(CURRENCY_COOKIE)
  const parsedCookie = cookie && cookie !== 'null' ? cookie : null

  // 1st cookie
  // 2nd user config
  // 3rd USD
  return parsedCookie || auth?.user?.locale || DEFAULT_CURRENCY
}
