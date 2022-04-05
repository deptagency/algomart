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

      return cssLoaderDarkModeShim(config)
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
      NODE_ENV: process.env.NODE_ENV,
    },
    redirects: async () => [
      {
        source: '/nft/:id',
        destination: '/nft/:id/details',
        permanent: false,
      },
    ],
  })
)

const cssLoaderDarkModeShim = (config) => {
  // Find the base rule that contains nested rules (which contains css-loader)
  const rules = config.module.rules.find((r) => !!r.oneOf)

  for (const loaders of rules.oneOf) {
    if (Array.isArray(loaders.use)) {
      for (const l of loaders.use) {
        if (
          typeof l !== 'string' &&
          typeof l.loader === 'string' &&
          /(?<!post)css-loader/.test(l.loader)
        ) {
          if (!l.options.modules) continue
          const originalGetLocalIdent = l.options.modules.getLocalIdent
          // update loader options `getLocalIdent` function to ignore 'dark' class
          l.options.modules.getLocalIdent = (
            context,
            localIdentName,
            localName,
            options
          ) =>
            localName === 'dark'
              ? localName
              : originalGetLocalIdent(
                  context,
                  localIdentName,
                  localName,
                  options
                )
        }
      }
    }
  }
  return config
}
