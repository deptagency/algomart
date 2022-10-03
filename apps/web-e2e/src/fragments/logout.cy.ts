import { getTestAnchor } from '@/support/utils'
export default () => {
  const baseURL = Cypress.env('BASE_URL')

  it('should allow a user to log out', () => {
    cy.visit(baseURL)

    getTestAnchor('nav-menu-open-button').click()
    getTestAnchor('user-menu')
    getTestAnchor('nav-menu-sign-out').click()

    cy.location('pathname').should('eq', '/')
  })
}
