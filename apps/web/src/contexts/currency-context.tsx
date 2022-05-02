import { CURRENCY_COOKIE, DEFAULT_CURRENCY } from '@algomart/schemas'
import * as Currencies from '@dinero.js/currencies'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useAuth } from '@/contexts/auth-context'
import { AuthService } from '@/services/auth-service'
import { getCookie } from '@/utils/cookies-web'
import { setCurrencyCookie } from '@/utils/cookies-web'

interface ICurrencyContext {
  currency: string
  updateCurrency: (currency: string) => Promise<boolean>
}

const CurrencyContext = createContext<ICurrencyContext>({
  currency: DEFAULT_CURRENCY,
  updateCurrency: () => Promise.resolve(true),
})

export const useCurrency = () => useContext(CurrencyContext)

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth(false)

  // We need to store the cookie value in state in order to force re-render on change.
  const [cookieCopy, setCookieCopy] = useState<string>()
  const parsedCookie = cookieCopy in Currencies ? cookieCopy : null

  const updateCurrency = useCallback(async (currency: string) => {
    // always update cookie even though it's only used when not logged in
    setCookieCopy(currency)
    setCurrencyCookie(currency)
    if (auth.user) {
      const success = await AuthService.instance.updateCurrency(currency)
      await auth.reloadProfile()
      return success
    }
    return true
  }, [])

  useEffect(() => {
    setCookieCopy(getCookie(CURRENCY_COOKIE))
  }, [])

  const value = useMemo(
    () => ({
      currency: auth.user?.currency || parsedCookie || DEFAULT_CURRENCY,
      updateCurrency,
    }),
    [auth.user?.currency, parsedCookie, DEFAULT_CURRENCY, updateCurrency]
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}
