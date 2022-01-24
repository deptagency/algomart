// ***********************************************
// Cypress commands
// Create custom commands and overwrite existing commands.
//
// More information: https://on.cypress.io/custom-commands
// ***********************************************

import '@testing-library/cypress/add-commands'

import { configure } from '@testing-library/cypress'

// Configuration for React Testing Library
configure({})

/*
 *
 * Custom command for initiating the creation of a user
 * @example cy.createUser()
 *
 */
Cypress.Commands.add(
  'createUser',
  (email: string, passphrase: string, password: string, username: string) => {
    return cy.exec('node ./src/utils/createUser.js', {
      env: { email, passphrase, password, username },
    })
  }
)

/*
 *
 * Custom command for cleaning up test users
 * @example cy.cleanupUser()
 *
 */
Cypress.Commands.add('cleanupUser', (email: string) => {
  return cy.exec('node ./src/utils/cleanupUser.js', {
    env: { email },
  })
})

/*
 *
 * Custom command for verifying a user's email
 * @example cy.verifyEmail()
 *
 */
Cypress.Commands.add('verifyEmail', (email: string) => {
  return cy.exec('node ./src/utils/cleanupUser.js', {
    env: { email },
  })
})
