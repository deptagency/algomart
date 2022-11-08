import { getTestAnchor } from '@/support/utils'

export default () => {
  const baseURL = Cypress.env('BASE_URL')

  it('should purchase credits', () => {
    cy.visit(baseURL)
    cy.location('pathname').should('eq', '/')
    getTestAnchor('nav-menu-open-button').click()
    getTestAnchor('user-menu')
    getTestAnchor('user-menu-my-wallet').click()
    cy.url().should('include', '/my/wallet')

    getTestAnchor('add-money-button').click()
    cy.location('pathname', { timeout: 10_000 }).should('eq', '/add-money')

    // Note: the `.type('{selectall}')` method selects all text in the input field
    cy.get('input[name=amount]').type('{selectall}').type('500')
    cy.get('input[name=firstName]').type('Jane')
    cy.get('input[name=lastName]').type('Smith')
    cy.get('input[name=ccNumber]').type('4757140000000001')
    cy.get('input[name=expMonth]').type('10')
    cy.get('input[name=expYear]').type('29')
    cy.get('input[name=securityCode]').type('123')

    // This next selector is a bit more complicated as we don't have control over
    // the markup and the output makes it difficult to target necessary elements
    cy.get('label[for="country"]')
      .within(() => {
        cy.get('input[role="combobox"]').type('United St')
      })
      .contains('🇺🇸 United States of America')
      .should('be.visible')
      .click()

    cy.get('input[name=address1]').type('123 Main Street')
    cy.get('input[name=city]').type('Boston')
    cy.get('input[name=state]').type('MA')
    cy.get('input[name=zipCode]').type('02118')
    cy.get('form').submit()

    // This next step needs a longer timeout as the payment needs to validate
    getTestAnchor('credits-success-action', { timeout: 20_000 }).click()
  })
}
