import { getGreeting } from '../support/app.po'

describe('signup', () => {
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
    cy.cleanupUser(email)
    // Navigate to the signup page from the login page, as a user would
    cy.visit('/login')
    cy.url().should('include', '/login')
    getGreeting().contains('Welcome')
    // Click to sign in with email
    cy.get('button[type=button]').findByText('Sign in with Email').click()
    cy.location('pathname').should('include', '/login-email')
    getGreeting().contains('Sign into your account')
    // Click to create a new account
    cy.get('a[href="/signup"]').click()
    cy.location('pathname').should('include', '/signup')
    getGreeting().contains('Setup your account')
    // Fill in and submit the login form
    cy.get('input[name=email]').type(email)
    cy.get('input[name=username]').type(username)
    cy.get('input[name=password]').type(password)
    // @TODO: Improve a11y of passphrase
    cy.get('input[data-id=0]').type(passphrase[0])
    cy.get('input[data-id=1]').type(passphrase[1])
    cy.get('input[data-id=2]').type(passphrase[2])
    cy.get('input[data-id=3]').type(passphrase[3])
    cy.get('input[data-id=4]').type(passphrase[4])
    cy.get('input[data-id=5]').type(passphrase[5])
    // Submit form
    cy.get('form').submit()
    // Confirm on the home page
    cy.location('pathname', { timeout: 10_000 }).should('eq', '/')
    // Update user to have email verified email
    cy.verifyEmail(email)
    // Click to refresh now that email is verified
    const validationText =
      "In order to make purchases, you'll need to validate your email address. Please check your inbox."
    cy.get('p').should('contain', validationText)
    cy.get('button').contains('Refresh').click()
    cy.get('p').findByText(validationText).should('not.exist')
  })
})
