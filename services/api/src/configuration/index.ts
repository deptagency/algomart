import { DEFAULT_CURRENCY } from '@algomart/schemas'
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

  get cmsAccessToken() {
    return env
      .get('CMS_ACCESS_TOKEN')
      .default('e38bcbf8093f52c19895ef8a4613b48a')
      .asString()
  },

  get webUrl() {
    return env.get('WEB_URL').default('http://localhost:3000').asUrlString()
  },

  get sendgridApiKey() {
    return env
      .get('SENDGRID_API_KEY')
      .default(
        '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'
      )
      .asString()
  },

  get sendgridFromEmail() {
    return env
      .get('SENDGRID_FROM_EMAIL')
      .default('jake@rocketinsights.com')
      .asString()
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
}
