import { DEFAULT_CURRENCY } from '@algomart/schemas'
import * as Currencies from '@dinero.js/currencies'
import { Currency } from 'dinero.js'
import { FirebaseOptions } from 'firebase/app'
import { ServiceAccount } from 'firebase-admin'
import getConfig from 'next/config'
import { Level } from 'pino'

import { ChainType } from './libs/algorand-adapter'

export interface PublicConfig {
  chainType: ChainType
  algoExplorerBaseUrl: string
  firebaseConfig: FirebaseOptions
  currency: Currency<number>
  isWireEnabled: boolean
  isCryptoEnabled: boolean
  isProduction: boolean
}

export interface PrivateConfig {
  firebaseServiceAccount: ServiceAccount
  firebaseAdminEmail: string
  apiKey: string
  apiUrl: string
  logLevel: Level
}

function getConfigByKey(key: string, fallback: string): string {
  const { serverRuntimeConfig = {} } = getConfig() || {}
  return serverRuntimeConfig[key] || fallback
}

export const Environment: PublicConfig & PrivateConfig = {
  get chainType(): ChainType {
    return getConfigByKey('chainType', ChainType.TestNet) as ChainType
  },

  get algoExplorerBaseUrl(): string {
    return {
      [ChainType.MainNet]: 'https://algoexplorer.io',
      [ChainType.TestNet]: 'https://testnet.algoexplorer.io',
      [ChainType.BetaNet]: 'https://betanet.algoexplorer.io',
    }[this.chainType]
  },

  get firebaseConfig() {
    return JSON.parse(
      getConfigByKey('NEXT_PUBLIC_FIREBASE_CONFIG', '{}')
    ) as FirebaseOptions
  },

  get firebaseServiceAccount() {
    return JSON.parse(
      getConfigByKey('FIREBASE_SERVICE_ACCOUNT', '{}')
    ) as ServiceAccount
  },

  get firebaseAdminEmail() {
    return getConfigByKey('FIREBASE_ADMIN_EMAIL', '')
  },

  get isProduction() {
    return getConfigByKey('NODE_ENV', 'development') === 'production'
  },

  get apiKey() {
    return getConfigByKey('API_KEY', '')
  },

  get apiUrl() {
    return getConfigByKey('API_URL', '')
  },

  get logLevel() {
    return getConfigByKey('LOG_LEVEL', 'info') as Level
  },

  get currency() {
    const code = getConfigByKey('CURRENCY', DEFAULT_CURRENCY)
    return Currencies[code as keyof typeof Currencies]
  },

  get isWireEnabled() {
    const isEnabled = getConfigByKey('NEXT_PUBLIC_WIRE_PAYMENT_ENABLED', '')
    return isEnabled.toLowerCase() === 'true'
  },

  get isCryptoEnabled() {
    const isEnabled = getConfigByKey('NEXT_PUBLIC_CRYPTO_PAYMENT_ENABLED', '')
    return isEnabled.toLowerCase() === 'true'
  },
}
