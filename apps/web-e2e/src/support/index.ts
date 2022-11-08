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
      createUsers(email: string, password: string, username: string): void
      cleanupUsers(email: string, username: string): void
      verifyEmail(email: string): void
    }
  }
}

import './commands'
