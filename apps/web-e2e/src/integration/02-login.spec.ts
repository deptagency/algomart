describe('login', () => {
  let email: string, passphrase: string, password: string, username: string
  beforeEach(() => {
    cy.configureCypressTestingLibrary({})
    cy.setCookie('cookie-consent', '1')
    cy.fixture('firebase')
      .as('credentials')
      .then((c) => {
        email = c.email
        passphrase = c.passphrase
        password = c.password
        username = c.username
      })
  })
  it('should login a user', () => {
    cy.createUser(email, passphrase, password, username)
    // Confirm its the login page and wait until page is loaded
    cy.visit('/login')
    cy.url().should('include', '/login')
    cy.contains('Welcome')
    // Click to sign in with email
    cy.url().should('include', '/login')
    cy.findByText('Sign in with Email').click()
    // Fill in the login form
    cy.get('input[name=email]').type(email)
    cy.get('input[name=password]').type(password)
    // Submit form
    cy.get('button[type=submit]').click()
    // Confirm on the home page
    cy.location('pathname').should('eq', '/')
    // Update user to have email verified email
    cy.verifyEmail(email)
  })

  it('should logout a user', () => {
    cy.createUser(email, passphrase, password, username)
    // Navigate to the profile page
    cy.findByLabelText('My Profile').click()
    cy.url().should('include', '/my/profile')
    cy.contains('My Profile')
    // Click to log the user out
    cy.get('button').contains('Sign Out').click({ force: true })
    // Confirm on the home page
    cy.location('pathname').should('eq', '/')
  })
})
