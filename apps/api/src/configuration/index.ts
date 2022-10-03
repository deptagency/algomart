import { DEFAULT_CURRENCY } from '@algomart/schemas'
import {
  MailerAdapterOptions,
  OnfidoAdapterOptions,
} from '@algomart/shared/adapters'
import * as Currencies from '@dinero.js/currencies'
import env from 'env-var'
import { ServiceAccount } from 'firebase-admin/app'
import { Level, levels } from 'pino'

export const Configuration = {
  get env() {
    return env.get('NODE_ENV').default('development').asString()
  },

  get logLevel() {
    return env
      .get('LOG_LEVEL')
      .default('warn')
      .asEnum(Object.keys(levels.values)) as Level
  },

  get host() {
    return env.get('HOST').default('0.0.0.0').asString()
  },

  get port() {
    return env.get('PORT').default(3001).asPortNumber()
  },

  get apiKey() {
    return env.get('API_KEY').required().asArray()
  },

  get firebaseServiceAccount() {
    return env
      .get('FIREBASE_SERVICE_ACCOUNT')
      .required()
      .asJsonObject() as ServiceAccount
  },

  get vault() {
    return {
      enabled: env.get('VAULT_ENABLED').asBool(),
      address: env.get('VAULT_ADDRESS').asString(),
      token: env.get('VAULT_TOKEN').asString(),
      gcpServiceAccountEmail: env.get('GCP_SERVICE_ACCOUNT_EMAIL').asString(),
      gcpAuthRoleName: env.get('VAULT_GCP_AUTH_ROLE_NAME').asString(),
      encryption: {
        enabled: env.get('VAULT_ENCRYPTION_ENABLED').asBool(),
        transitPath: env.get('VAULT_TRANSIT_PATH').asString(),
        keyName: env
          .get('VAULT_CUSTODIAL_ACCOUNT_ENCRYPTION_KEY_NAME')
          .asString(),
      },
    }
  },

  get fundingMnemonic() {
    return env.get('FUNDING_MNEMONIC').required().asString()
  },

  get algodToken() {
    return env.get('ALGOD_TOKEN').default('').asString()
  },

  get algodServer() {
    return env.get('ALGOD_SERVER').required().asUrlString()
  },

  get algodPort() {
    return env.get('ALGOD_PORT').default(443).asPortNumber()
  },

  get algorandEnvironment() {
    return env
      .get('ALGOD_ENV')
      .default('testnet')
      .asEnum(['betanet', 'testnet', 'mainnet'])
  },

  get indexerPort() {
    return env.get('INDEXER_PORT').default(443).asPortNumber()
  },

  get indexerServer() {
    return env.get('INDEXER_SERVER').required().asUrlString()
  },

  get indexerToken() {
    return env.get('INDEXER_TOKEN').default('').asString()
  },

  get databaseConnection() {
    const useSSL = env.get('DB_USE_SSL').default('false').asBool()
    return useSSL
      ? {
          host: env.get('DB_HOST').required().asString(),
          port: env.get('DB_PORT').default(5432).asPortNumber(),
          database: env.get('DATABASE').required().asString(),
          user: env.get('DB_USER').required().asString(),
          password: env.get('DB_PASSWORD').required().default('').asString(),
          ssl: {
            ca: env.get('DB_ROOT_CERT').required().asString(),
          },
        }
      : env.get('DATABASE_URL').required().asUrlString()
  },

  get databaseUrl() {
    return env.get('DATABASE_URL').required().asUrlString()
  },

  get databaseMainMinPool() {
    return env.get('DATABASE_WRITE_MIN_POOL').default(2).asInt()
  },

  get databaseMainMaxPool() {
    return env.get('DATABASE_WRITE_MAX_POOL').default(2).asInt()
  },

  get databaseReadMinPool() {
    return env.get('DATABASE_READ_MIN_POOL').default(2).asInt()
  },

  get databaseReadMaxPool() {
    return env.get('DATABASE_READ_MAX_POOL').default(2).asInt()
  },

  get databaseSchema() {
    return env.get('DATABASE_SCHEMA').default('public').asString()
  },

  get secret() {
    return env
      .get('SECRET')
      .default('fCtUCXv6ATjqbxayeAEPs5Du47hH0OcB')
      .asString()
  },

  get cmsUrl() {
    return env.get('CMS_URL').default('http://localhost:8055').asUrlString()
  },

  get gcpCdnUrl() {
    return env.get('GCP_CDN_URL').asUrlString()
  },

  get webUrl() {
    return env.get('WEB_URL').default('http://localhost:3000').asUrlString()
  },

  get enforcerAppID() {
    return env.get('ENFORCER_APP_ID').default(0).asIntPositive()
  },

  get coldKeyAddress() {
    return env.get('COLD_KEY_ADDRESS').default('').asString()
  },

  get cacheRedis() {
    return {
      url: env
        .get('CACHE_REDIS_URL')
        .default('redis://localhost:6379')
        .asUrlString(),
      ttlInSeconds: env
        .get('CACHE_REDIS_TTL_IN_SECONDS')
        .default(60)
        .asIntPositive(),
      enabled:
        Configuration.env !== 'test' &&
        env.get('CACHE_REDIS_ENABLED').default('false').asBool(),
    }
  },

  get rateLimitRedis() {
    const fallback = Configuration.cacheRedis
    return {
      url: env.get('RATE_LIMIT_REDIS_URL').default(fallback.url).asUrlString(),
      ttlInSeconds: env
        .get('RATE_LIMIT_REDIS_TTL_IN_SECONDS')
        .default(fallback.ttlInSeconds)
        .asIntPositive(),
      enabled: env
        .get('RATE_LIMIT_REDIS_ENABLED')
        .default(String(fallback.enabled))
        .asBool(),
    }
  },

  get jobsRedis() {
    return {
      url: env
        .get('JOBS_REDIS_URL')
        .default('redis://localhost:6379')
        .asUrlString(),
      maxListeners: env
        .get('JOBS_REDIS_MAX_LISTENERS')
        .default(100)
        .asIntPositive(),
    }
  },

  get pinataApiKey() {
    return env.get('PINATA_API_KEY').required().asString()
  },

  get pinataApiSecret() {
    return env.get('PINATA_API_SECRET').required().asString()
  },

  get circleUrl() {
    return env
      .get('CIRCLE_URL')
      .default('https://api-sandbox.circle.com')
      .asUrlString()
  },

  get circleApiKey() {
    return env.get('CIRCLE_API_KEY').required().asString()
  },

  get coinbaseUrl() {
    return env
      .get('COINBASE_URL')
      .default('https://api.coinbase.com')
      .asUrlString()
  },

  get currency() {
    const code = env
      .get('CURRENCY')
      .default(DEFAULT_CURRENCY)
      .asEnum(Object.keys(Currencies))
    return Currencies[code as keyof typeof Currencies]
  },

  get customerServiceEmail() {
    return env.get('CUSTOMER_SERVICE_EMAIL').default('').asString()
  },

  get mailer(): MailerAdapterOptions {
    const emailFrom =
      env.get('EMAIL_FROM').default('').asString() ||
      env.get('SENDGRID_FROM_EMAIL').default('').asString()

    const emailName = env.get('EMAIL_NAME').default('AlgoMart').asString()

    const emailTransport = env
      .get('EMAIL_TRANSPORT')
      .required()
      .asEnum(['smtp', 'sendgrid'])

    const smtpHost = env.get('SMTP_HOST').default('').asString()
    const smtpPort = env.get('SMTP_PORT').default(1).asPortNumber()
    const smtpUser = env.get('SMTP_USER').default('').asString()
    const smtpPassword = env.get('SMTP_PASSWORD').default('').asString()
    const sendGridApiKey = env.get('SENDGRID_API_KEY').default('').asString()

    return {
      emailFrom,
      emailName,
      emailTransport,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      sendGridApiKey,
    }
  },

  get enableMarketplace(): boolean {
    return env.get('ENABLE_MARKETPLACE').default('false').asBool()
  },

  get minimumDaysBeforeCashout(): number {
    return env.get('MINIMUM_DAYS_BEFORE_CASHOUT').default(7).asInt()
  },

  get minimumDaysBetweenTransfers(): number {
    return env.get('MINIMUM_DAYS_BETWEEN_TRANSFERS').default(7).asInt()
  },

  get royaltyBasisPoints(): number {
    return env.get('ROYALTY_BASIS_POINTS').default(500).asInt()
  },

  get isKYCEnabled(): boolean {
    return env.get('IS_KYC_ENABLED').default('false').asBool()
  },

  get onfidoOptions(): OnfidoAdapterOptions {
    return {
      isEnabled: this.isKYCEnabled,
      onboardingWorkflowId: env
        .get('ONFIDO_ONBOARDING_WORKFLOW_ID')
        .default('')
        .asString(),
      token: env.get('ONFIDO_TOKEN').default('').asString(),
      url: env
        .get('ONFIDO_URL')
        .default('https://api.us.onfido.com')
        .asUrlString(),
      webhookToken: env.get('ONFIDO_WEBHOOK_TOKEN').default('').asString(),
      webUrl: this.webUrl,
      cmsUrl: `${this.cmsUrl}admin/content/kyc_management`,
    }
  },

  get chainalysisUrl() {
    return env
      .get('CHAINALYSIS_URL')
      .default('https://public.chainalysis.com')
      .asUrlString()
  },

  get chainalysisApiKey() {
    return env.get('CHAINALYSIS_API_KEY').required().asString()
  },

  get ipGeolocationUrl() {
    return env.get('IPGEOLOCATION_URL').required().asString()
  },

  get ipGeolocationApiKey() {
    return env.get('IPGEOLOCATION_API_KEY').required().asString()
  },
}
