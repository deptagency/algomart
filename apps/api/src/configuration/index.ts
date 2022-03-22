import { DEFAULT_CURRENCY } from '@algomart/schemas'
import { MailerAdapterOptions } from '@algomart/shared/adapters'
import * as Currencies from '@dinero.js/currencies'
import env from 'env-var'

export const Configuration = {
  get env() {
    return env.get('NODE_ENV').default('development').asString()
  },

  get logLevel() {
    return env.get('LOG_LEVEL').default('info').asString()
  },

  get host() {
    return env.get('HOST').default('localhost').asString()
  },

  get port() {
    return env.get('PORT').default(3001).asPortNumber()
  },

  get apiKey() {
    return env
      .get('API_KEY')
      .default('9ieTxoN1uvyX8qtKUzn7AktBpyt7DvFQ')
      .asArray()
  },

  get fundingMnemonic() {
    return env
      .get('FUNDING_MNEMONIC')
      .default(
        'satoshi ocean cook satoshi acquire will useful raven rich concert skate quarter warfare reduce immune naive cliff same recall kangaroo lottery balcony viable about wrap'
      )
      .asString()
  },

  get algodToken() {
    return env
      .get('ALGOD_TOKEN')
      .default(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      )
      .asString()
  },

  get algodServer() {
    return env.get('ALGOD_SERVER').default('http://localhost').asUrlString()
  },

  get algodPort() {
    return env.get('ALGOD_PORT').default('4001').asPortNumber()
  },

  get algodEnv() {
    return env
      .get('ALGOD_ENV')
      .required()
      .default('testnet')
      .asEnum(['betanet', 'testnet', 'mainnet'])
  },

  get databaseUrl() {
    return env
      .get('DATABASE_URL')
      .default('postgres://localhost/postgres')
      .asUrlString()
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

  get cmsPublicUrl() {
    return this.cmsUrl
    // return env.get('CMS_PUBLIC_URL').default(this.cmsUrl).asUrlString()
  },

  get cmsAccessToken() {
    return env
      .get('CMS_ACCESS_TOKEN')
      .default('e38bcbf8093f52c19895ef8a4613b48a')
      .asString()
  },

  get webUrl() {
    return env.get('WEB_URL').default('http://localhost:3000').asUrlString()
  },

  get pinataApiKey() {
    return env.get('PINATA_API_KEY').default('').asString()
  },

  get pinataApiSecret() {
    return env.get('PINATA_API_SECRET').default('').asString()
  },

  get creatorPassphrase() {
    return env
      .get('CREATOR_PASSPHRASE')
      .default('7ebdafea339b5863b1e82ba5c8873d36')
      .asString()
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
    return env.get('CUSTOMER_SERVICE_EMAIL').asString()
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

  get enableJobs(): boolean {
    return env.get('ENABLE_JOBS').default('false').asBool()
  },
}
