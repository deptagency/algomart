import { DEFAULT_CURRENCY } from '@algomart/schemas'
import * as Currencies from '@dinero.js/currencies'
import { FirebaseOptions } from 'firebase/app'
import { ServiceAccount } from 'firebase-admin'
import getConfig from 'next/config'

import { ChainType } from './libs/algorand-adapter'

export const Environment = {
  config(key: string, fallback: string): string {
    const { publicRuntimeConfig = {}, serverRuntimeConfig = {} } =
      getConfig() || {}
    return publicRuntimeConfig[key] || serverRuntimeConfig[key] || fallback
  },

  get chainType(): ChainType {
    return this.config('chainType', ChainType.TestNet)
  },

  get firebaseConfig() {
    return JSON.parse(
      this.config('NEXT_PUBLIC_FIREBASE_CONFIG', '{}')
    ) as FirebaseOptions
  },

  get firebaseServiceAccount() {
    return JSON.parse(
      this.config('FIREBASE_SERVICE_ACCOUNT', '{}')
    ) as ServiceAccount
  },

  get firebaseAdminEmail() {
    return this.config('FIREBASE_ADMIN_EMAIL', '')
  },

  get isProduction() {
    return this.config('NODE_ENV', 'development') === 'production'
  },

  get apiKey() {
    return this.config('API_KEY', '')
  },

  get apiUrl() {
    return this.config('API_URL', '')
  },

  get logLevel() {
    return this.config('LOG_LEVEL', 'info')
  },

  get currency() {
    const code = this.config('CURRENCY', DEFAULT_CURRENCY)
    return Currencies[code as keyof typeof Currencies]
  },

  get isWireEnabled() {
    const isEnabled = this.config('NEXT_PUBLIC_WIRE_PAYMENT_ENABLED', '')
    return isEnabled.toLowerCase() === 'true'
  },

  get isCryptoEnabled() {
    const isEnabled = this.config('NEXT_PUBLIC_CRYPTO_PAYMENT_ENABLED', '')
    return isEnabled.toLowerCase() === 'true'
  },
}
