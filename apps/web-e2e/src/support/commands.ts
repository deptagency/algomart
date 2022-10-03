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

// Set up the base environment variables that should be used in non-cypress util functions
const base_env = {
  firebaseServiceAccount: JSON.stringify(
    Cypress.env('FIREBASE_SERVICE_ACCOUNT')
  ),
  firebaseOptions: JSON.stringify(Cypress.env('FIREBASE_OPTIONS')),
  apiURL: Cypress.env('API_URL'),
}

/*
 * Custom command for initiating the creation of a user
 * @example cy.createUsers('user@email.com', 'password', 'username)
 */
Cypress.Commands.add(
  'createUsers',
  (email: string, password: string, username: string) => {
    return cy.exec('node ./src/chainable-functions/createUsers.mjs', {
      env: {
        ...base_env,
        email,
        password,
        username,
      },
    })
  }
)

/*
 * Custom command for cleaning up test users
 * @example cy.cleanupUsers('user@email.com', 'username')
 */
Cypress.Commands.add('cleanupUsers', (email: string, username: string) => {
  return cy.exec('node ./src/chainable-functions/cleanupUsers.js', {
    env: {
      ...base_env,
      email,
      username,
    },
  })
})

/*
 * Custom command for verifying a user's email
 * @example cy.verifyEmail('user@email.com')
 */
Cypress.Commands.add('verifyEmail', (email: string) => {
  return cy.exec('node ./src/chainable-functions/verifyEmail.js', {
    env: {
      ...base_env,
      email,
    },
  })
})
