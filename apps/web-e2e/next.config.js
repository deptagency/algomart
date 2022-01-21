const withNx = require('@nrwl/next/plugins/with-nx')

module.exports = withNx({
  serverRuntimeConfig: {
    API_KEY: process.env.API_KEY,
    API_URL: process.env.API_URL,
    FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
  },
})
