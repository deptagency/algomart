import type { AppProps } from 'next/app'
import { SWRConfig } from 'swr'

import '../styles/globals.css'

import CookieConsent from '@/components/cookie-consent/cookie-consent'
import { AuthProvider } from '@/contexts/auth-context'
import { RedemptionProvider } from '@/contexts/redemption-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { fetcher } from '@/utils/swr'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig value={{ fetcher }}>
      <RedemptionProvider>
        <AuthProvider>
          <ThemeProvider>
            <Component {...pageProps} />
            <CookieConsent />
          </ThemeProvider>
        </AuthProvider>
      </RedemptionProvider>
    </SWRConfig>
  )
}

// Ensure we can use Next.js runtime configuration
MyApp.getInitialProps = () => ({})

export default MyApp
