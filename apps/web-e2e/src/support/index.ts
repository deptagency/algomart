// ***********************************************************
// This support/index.js file is processed and
// loaded automatically before the test files.
//
// Add any global configuration and behavior
// that modifies Cypress in here.
//
// More information: https://on.cypress.io/configuration
// ***********************************************************

// Cypress Testing Library extends Cypress' cy command
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      createUser(
        email: string,
        passphrase: string,
        password: string,
        username: string
      ): void
      cleanupUser(email: string): void
      verifyEmail(email: string): void
    }
  }
}

import './commands'
import './cookies'
