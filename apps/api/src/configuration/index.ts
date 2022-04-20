import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { MailerAdapterOptions } from '@algomart/shared/adapters'
import * as Currencies from '@dinero.js/currencies'
import env from 'env-var'
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

  get fundingMnemonic() {
    return env.get('FUNDING_MNEMONIC').required().asString()
  },

  get algodToken() {
    return env.get('ALGOD_TOKEN').required().asString()
  },

  get algodServer() {
    return env.get('ALGOD_SERVER').required().asUrlString()
  },

  get algodPort() {
    return env.get('ALGOD_PORT').default('').asPortNumber()
  },

  get algodEnv() {
    return env
      .get('ALGOD_ENV')
      .default('testnet')
      .asEnum(['betanet', 'testnet', 'mainnet'])
  },

  get databaseUrl() {
    return env.get('DATABASE_URL').required().asUrlString()
  },

  get databaseSchema() {
    return env.get('DATABASE_SCHEMA').default('public').asString()
  },

  get secret() {
    return env.get('SECRET').required().asString()
  },

  get cmsUrl() {
    return env.get('CMS_URL').default('http://localhost:8055').asUrlString()
  },

  get gcpCdnUrl() {
    return env.get('GCP_CDN_URL').asUrlString()
  },

  get cmsAccessToken() {
    return env.get('CMS_ACCESS_TOKEN').required().asString()
  },

  get webUrl() {
    return env.get('WEB_URL').default('http://localhost:3000').asUrlString()
  },

  get pinataApiKey() {
    return env.get('PINATA_API_KEY').required().asString()
  },

  get pinataApiSecret() {
    return env.get('PINATA_API_SECRET').required().asString()
  },

  get creatorPassphrase() {
    return env.get('CREATOR_PASSPHRASE').required().asString()
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

  get minimumDaysBeforeTransfer(): number {
    return env.get('MINIMUM_DAYS_BEFORE_TRANSFER').default(7).asInt()
  },

  get successPath(): string {
    return env.get('WEB_SUCCESS_PATH').default('/payments/success').asString()
  },

  get failurePath(): string {
    return env.get('WEB_FAILURE_PATH').default('/payments/failure').asString()
  },

  get enableCluster(): boolean {
    return env.get('ENABLE_CLUSTER').default('false').asBool()
  },
}
