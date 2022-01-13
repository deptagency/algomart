import { getGreeting } from '../support/app.po'

describe('login', () => {
  let email: string, passphrase: string, password: string, username: string
  beforeEach(() => {
    cy.configureCypressTestingLibrary({})
    cy.fixture('firebase')
      .as('credentials')
      .then((c) => {
        email = c.email
        passphrase = c.passphrase
        password = c.password
        username = c.username
      })
  })
  it('should sign up a user', () => {
    cy.createUser(email, passphrase, password, username)
    // Confirm its the login page and wait until page is loaded
    cy.visit('/login')
    cy.url().should('include', '/login')
    getGreeting().contains('Welcome')
    // Click to sign in with email
    cy.url().should('include', '/login')
    cy.get('button').findByText('Sign in with Email').click()
    // Fill in the login form
    cy.get('input[name=email]').type(email)
    cy.get('input[name=password]').type(password)
    // Submit form
    cy.get('button[type=submit]').click()
  })
})
