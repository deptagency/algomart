import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { ChainType } from '@algomart/shared/algorand'
import * as Currencies from '@dinero.js/currencies'
import { Currency } from 'dinero.js'
import type { FirebaseOptions } from 'firebase/app'
import type { ServiceAccount } from 'firebase-admin'
import getConfig from 'next/config'
import { Level } from 'pino'

export interface PublicConfig {
  algoExplorerBaseURL: string
  apiURL: string
  chainType: ChainType
  currency: Currency<number>
  firebaseConfig: FirebaseOptions
  githubRefName: string
  githubSHA: string
  isBiddingEnabled: boolean
  isCryptoEnabled: boolean
  isProduction: boolean
  isTransfersEnabled: boolean
  debugThreeJS: boolean
}

export interface PrivateConfig {
  firebaseAdminEmail: string
  firebaseServiceAccount: ServiceAccount
  logLevel: Level
  revalidateToken: string
}

export type FullConfig = PublicConfig & PrivateConfig

function getRawConfigByKey(key: string, fallback = ''): string {
  if (typeof window !== 'undefined')
    return window.__PUBLIC_CONFIG__[key] ?? fallback
  const { serverRuntimeConfig = {} } = getConfig() ?? {}
  return serverRuntimeConfig[key] ?? fallback
}

const publicConfigKeys = [
  'API_URL',
  'CHAIN_TYPE',
  'CRYPTO_PAYMENT_ENABLED',
  'CURRENCY',
  'DEBUG_THREE_JS',
  'FIREBASE_CONFIG',
  'GITHUB_REF_NAME',
  'GITHUB_SHA',
  'IS_BIDDING_ENABLED',
  'IS_CRYPTO_ENABLED',
  'IS_TRANSFERS_ENABLED',
  'NODE_ENV',
]

export function getRawPublicConfig() {
  const { serverRuntimeConfig = {} } = getConfig() || {}
  return Object.fromEntries(
    publicConfigKeys.map((key) => [key, serverRuntimeConfig[key]])
  )
}

export const AppConfig: FullConfig = {
  get chainType(): ChainType {
    return getRawConfigByKey('CHAIN_TYPE', ChainType.TestNet) as ChainType
  },

  get algoExplorerBaseURL(): string {
    return {
      [ChainType.MainNet]: 'https://algoexplorer.io',
      [ChainType.TestNet]: 'https://testnet.algoexplorer.io',
      [ChainType.BetaNet]: 'https://betanet.algoexplorer.io',
    }[this.chainType]
  },

  get revalidateToken() {
    return getRawConfigByKey('REVALIDATE_TOKEN')
  },

  get firebaseConfig() {
    return JSON.parse(
      getRawConfigByKey('FIREBASE_CONFIG', '{}')
    ) as FirebaseOptions
  },

  get firebaseServiceAccount() {
    return JSON.parse(
      getRawConfigByKey('FIREBASE_SERVICE_ACCOUNT', '{}')
    ) as ServiceAccount
  },

  get firebaseAdminEmail() {
    return getRawConfigByKey('FIREBASE_ADMIN_EMAIL')
  },

  get isProduction() {
    return getRawConfigByKey('NODE_ENV', 'development') === 'production'
  },

  get apiURL() {
    return getRawConfigByKey('API_URL')
  },

  get logLevel() {
    return getRawConfigByKey('LOG_LEVEL', 'info') as Level
  },

  get currency() {
    const code = getRawConfigByKey('CURRENCY', DEFAULT_CURRENCY)
    return Currencies[code as keyof typeof Currencies]
  },

  get githubRefName() {
    const version = getRawConfigByKey('GITHUB_REF_NAME')
    return version
  },

  get githubSHA() {
    const version = getRawConfigByKey('GITHUB_SHA').slice(0, 7)
    return version
  },

  get isCryptoEnabled() {
    const isEnabled = getRawConfigByKey('CRYPTO_PAYMENT_ENABLED')
    return isEnabled.toLowerCase() === 'true'
  },

  get isBiddingEnabled() {
    const isEnabled = getRawConfigByKey('IS_BIDDING_ENABLED')
    return isEnabled.toLowerCase() === 'true'
  },

  get isTransfersEnabled() {
    const isEnabled = getRawConfigByKey('IS_TRANSFERS_ENABLED')
    return isEnabled.toLowerCase() === 'true'
  },

  get debugThreeJS() {
    const isEnabled = getRawConfigByKey('DEBUG_THREE_JS')
    return isEnabled.toLowerCase() === 'true'
  },
}
