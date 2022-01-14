const nextTranslate = require('next-translate')
const transpileModules = require('next-transpile-modules')(['ky'])

module.exports = transpileModules(
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
    serverRuntimeConfig: {
      API_KEY: process.env.API_KEY,
      API_URL: process.env.API_URL,
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
      NODE_ENV: process.env.NODE_ENV,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      SENDGRID_EMAIL: process.env.SENDGRID_EMAIL,
    },
    publicRuntimeConfig: {
      NEXT_PUBLIC_FIREBASE_CONFIG: process.env.NEXT_PUBLIC_FIREBASE_CONFIG,
      NEXT_PUBLIC_WIRE_PAYMENT_ENABLED:
        process.env.NEXT_PUBLIC_WIRE_PAYMENT_ENABLED,
    },
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
