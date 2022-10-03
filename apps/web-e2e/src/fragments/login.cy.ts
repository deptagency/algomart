import { getTestAnchor } from '@/support/utils'
export default (email: string, password: string) => {
  before(() => {
    cy.clearLocalStorage()
  })

  const baseURL = Cypress.env('BASE_URL')

  it('should log in with an existing user', () => {
    cy.visit(baseURL)
    cy.location('pathname').should('eq', '/')

    getTestAnchor('main-nav-signin-link').click()
    cy.url().should('include', '/login-email')

    cy.get('input[name=email]').type(email)
    cy.get('input[name=password]').type(password)
    cy.get('form').submit()

    cy.location('pathname').should('eq', '/')
  })
}
