/**
 * @type {Cypress.PluginConfig}
 **/
module.exports = (on, config) => {
  // Env variables
  config.env.API_URL = process.env.API_URL
  config.env.API_KEY = process.env.API_KEY
  config.env.FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT
  return config
}
