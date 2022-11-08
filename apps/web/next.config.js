// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('node:fs')
const withNextTranslate = require('next-translate')
const webpack = require('webpack')
const withNx = require('@nrwl/next/plugins/with-nx')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

// Read / store Git version data for display in the app
let GITHUB_REF_NAME
let GITHUB_SHA

try {
  GITHUB_REF_NAME = fs.readFileSync(`GITHUB_REF_NAME.txt`, 'utf8').trim()
} catch {
  console.log('error reading GITHUB_REF_NAME')
}
try {
  GITHUB_SHA = fs.readFileSync(`GITHUB_SHA.txt`, 'utf8').trim()
} catch {
  console.log('error reading GITHUB_SHA')
}

process.env.NEXT_TRANSLATE_PATH = __dirname

/** @type {import('next').NextConfig} */
const baseNextConfig = {
  poweredByHeader: false,

  reactStrictMode: true,

  images: {
    domains: process.env.IMAGE_DOMAINS?.split(',') || [],
  },

  i18n: {
    localeDetection: false,
  },

  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      asyncWebAssembly: true,
    }

    // Handle `node:` schemas by ignoring them ¯\_(ツ)_/¯
    config.plugins = [
      ...config.plugins,
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '')
      }),
    ]

    return config
  },

  eslint: {
    // disable and run eslint manually as needed instead
    ignoreDuringBuilds: true,
  },

  serverRuntimeConfig: {
    // Private
    LOG_LEVEL: process.env.LOG_LEVEL,
    FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,

    // Public
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_REF_NAME,
    GITHUB_SHA,
    API_URL: process.env.API_URL,
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
    CRYPTO_PAYMENT_ENABLED: process.env.CRYPTO_PAYMENT_ENABLED,
    IS_BIDDING_ENABLED: process.env.IS_BIDDING_ENABLED,
    IS_TRANSFERS_ENABLED: process.env.IS_TRANSFERS_ENABLED,
    CHAIN_TYPE: process.env.CHAIN_TYPE,
  },
}

module.exports = withNx(
  withNextTranslate(
    withBundleAnalyzer({
      ...baseNextConfig,
      nx: {
        // Enable SVGR for SVG files
        svgr: true,
      },
    })
  )
)
