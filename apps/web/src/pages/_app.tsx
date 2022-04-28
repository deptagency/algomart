import { RTL_LANGUAGES } from '@algomart/schemas'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SWRConfig } from 'swr'

import '../styles/globals.css'

import CookieConsent from '@/components/cookie-consent/cookie-consent'
import { AuthProvider } from '@/contexts/auth-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { I18nProvider } from '@/contexts/i18n-context'
import { RedemptionProvider } from '@/contexts/redemption-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { useAnalytics } from '@/hooks/use-analytics'
import { useLanguage } from '@/hooks/use-language'
import { fetcher } from '@/utils/swr'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const language = useLanguage()
  const analytics = useAnalytics()

  useEffect(() => {
    router.push(
      { pathname: router.pathname, query: router.query },
      router.asPath,
      { locale: language }
    )
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    document.documentElement.dir = RTL_LANGUAGES.includes(
      language.split('-')[0]
    )
      ? 'rtl'
      : 'ltr'
  }, [language])

  useEffect(() => {
    // First page load
    analytics.screenView(window.location.pathname)

    // Route changes
    router.events.on('routeChangeComplete', (event) => {
      analytics.screenView(event)
    })

    // Cleanup
    return () => {
      router.events.off('routeChangeComplete', analytics.screenView)
    }
  }, [analytics, router.events])

  return (
    <SWRConfig value={{ fetcher }}>
      <RedemptionProvider>
        <AuthProvider>
          <I18nProvider>
            <CurrencyProvider>
              <ThemeProvider>
                <Component {...pageProps} />
                <CookieConsent />
              </ThemeProvider>
            </CurrencyProvider>
          </I18nProvider>
        </AuthProvider>
      </RedemptionProvider>
    </SWRConfig>
  )
}

export default MyApp
