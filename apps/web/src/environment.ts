import { DEFAULT_CURRENCY } from '@algomart/schemas'
import * as Currencies from '@dinero.js/currencies'
import { FirebaseOptions } from 'firebase/app'
import { ServiceAccount } from 'firebase-admin'
import getConfig from 'next/config'

export const Environment = {
  config<T = string>(key: string, fallback: T) {
    const { publicRuntimeConfig = {}, serverRuntimeConfig = {} } =
      getConfig() || {}
    return (publicRuntimeConfig[key] ||
      serverRuntimeConfig[key] ||
      fallback) as T
  },

  get firebaseConfig() {
    return JSON.parse(
      this.config<string>('NEXT_PUBLIC_FIREBASE_CONFIG', '{}')
    ) as FirebaseOptions
  },

  get firebaseServiceAccount() {
    return JSON.parse(
      this.config<string>('FIREBASE_SERVICE_ACCOUNT', '{}')
    ) as ServiceAccount
  },

  get circleApiKey() {
    return this.config('CIRCLE_API_KEY', '')
  },

  get circleUrl() {
    return this.config('CIRCLE_URL', '')
  },

  get sendgridApiKey() {
    return this.config('SENDGRID_API_KEY', '')
  },

  get sendgridEmail() {
    return this.config('SENDGRID_EMAIL', '')
  },

  get isProduction() {
    return this.config<string>('NODE_ENV', 'development') === 'production'
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
    const code = this.config<keyof typeof Currencies>(
      'CURRENCY',
      DEFAULT_CURRENCY
    )
    return Currencies[code as keyof typeof Currencies]
  },
}
