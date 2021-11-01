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
      return config
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
    },
  })
)
