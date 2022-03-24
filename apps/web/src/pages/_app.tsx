import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SWRConfig } from 'swr'

import '../styles/globals.css'

import { Analytics } from '@/clients/firebase-analytics'
import CookieConsent from '@/components/cookie-consent/cookie-consent'
import { AuthProvider } from '@/contexts/auth-context'
import { I18nProvider } from '@/contexts/i18n-context'
import { RedemptionProvider } from '@/contexts/redemption-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { fetcher } from '@/utils/swr'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // First page load
    Analytics.instance.screenView(window.location.pathname)

    // Route changes
    router.events.on('routeChangeComplete', (event) => {
      Analytics.instance.screenView(event)
    })

    // Cleanup
    return () => {
      router.events.off('routeChangeComplete', Analytics.instance.screenView)
    }
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <SWRConfig value={{ fetcher }}>
      <RedemptionProvider>
        <AuthProvider>
          <I18nProvider>
            <ThemeProvider>
              <Component {...pageProps} />
              <CookieConsent />
            </ThemeProvider>
          </I18nProvider>
        </AuthProvider>
      </RedemptionProvider>
    </SWRConfig>
  )
}

// Ensure we can use Next.js runtime configuration
MyApp.getInitialProps = () => ({})

export default MyApp
