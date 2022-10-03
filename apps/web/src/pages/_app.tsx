import {
  Hydrate,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import type { AppProps } from 'next/app'
import { useMemo } from 'react'

import '../styles/globals.css'

import { AuthProvider } from '@/contexts/auth-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { I18nProvider } from '@/contexts/i18n-context'
import { LanguageProvider } from '@/contexts/language-context'
import { PendingCreditsProvider } from '@/contexts/pending-credits-context'
import { RedemptionProvider } from '@/contexts/redemption-context'
import { WalletConnectProvider } from '@/contexts/wallet-connect-context'
import { SetupRedirectGuard } from '@/guards/setup-redirect'

// Wrapping MyApp with QueryClientProvider because useConfig
// needs queryClient set
function AlgomartApp(appProps: AppProps) {
  const queryClient = useMemo(() => new QueryClient(), [])
  return (
    <QueryClientProvider client={queryClient}>
      <Hydrate state={appProps.pageProps.dehydratedState}>
        <MyApp {...appProps} />
      </Hydrate>
    </QueryClientProvider>
  )
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <RedemptionProvider>
        <WalletConnectProvider>
          <AuthProvider>
            <SetupRedirectGuard>
              <CurrencyProvider>
                <LanguageProvider>
                  <I18nProvider>
                    <PendingCreditsProvider>
                      <Component {...pageProps} />
                    </PendingCreditsProvider>
                  </I18nProvider>
                </LanguageProvider>
              </CurrencyProvider>
            </SetupRedirectGuard>
          </AuthProvider>
        </WalletConnectProvider>
      </RedemptionProvider>
    </>
  )
}

export default AlgomartApp
