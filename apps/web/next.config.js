// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextTranslate = require('next-translate')
const withNx = require('@nrwl/next/plugins/with-nx')

process.env.NEXT_TRANSLATE_PATH = __dirname

module.exports = withNx(
  nextTranslate({
    poweredByHeader: false,
    reactStrictMode: true,
    images: {
      domains: process.env.IMAGE_DOMAINS?.split(',') || [],
    },
    webpack: (config) => {
      config.experiments = {
        ...config.experiments,
        topLevelAwait: true,
        asyncWebAssembly: true,
      }
      return config
    },
    eslint: {
      // disable and run eslint manually as needed instead
      ignoreDuringBuilds: true,
    },
    nx: {
      // Set this to true if you would like to to use SVGR
      // See: https://github.com/gregberge/svgr
      svgr: false,
    },
    serverRuntimeConfig: {
      API_KEY: process.env.API_KEY,
      API_URL: process.env.API_URL,
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_ADMIN_EMAIL: process.env.FIREBASE_ADMIN_EMAIL,
    },
    publicRuntimeConfig: {
      NEXT_PUBLIC_FIREBASE_CONFIG: process.env.NEXT_PUBLIC_FIREBASE_CONFIG,
      NEXT_PUBLIC_WIRE_PAYMENT_ENABLED:
        process.env.NEXT_PUBLIC_WIRE_PAYMENT_ENABLED,
      NEXT_PUBLIC_CRYPTO_PAYMENT_ENABLED:
        process.env.NEXT_PUBLIC_CRYPTO_PAYMENT_ENABLED,
    },
  })
)
