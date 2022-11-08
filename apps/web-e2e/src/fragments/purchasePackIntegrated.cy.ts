import { getTestAnchor } from '@/support/utils'

export default () => {
  const baseURL = Cypress.env('BASE_URL')
  const testPackSlug = Cypress.env('TEST_PACK_SLUG')

  it('should allow a logged-in user to purchase a pack before adding credits', () => {
    cy.visit(baseURL)
    getTestAnchor(`main-nav-Drops-link`, { timeout: 10_000 }).click()
    cy.get(`a[href="/drops/${testPackSlug}"]`).should('be.visible').click()
    cy.location('pathname').should('eq', `/drops/${testPackSlug}`)

    getTestAnchor('pack-template-info')
    getTestAnchor('buy-now-button').click()
    cy.location('pathname').should('eq', `/checkout/pack/${testPackSlug}`)

    cy.get('input[name=firstName]').type('Jane')
    cy.get('input[name=lastName]').type('Smith')
    cy.get('input[name=ccNumber]').type('4757140000000001')
    cy.get('input[name=expMonth]').type('10')
    cy.get('input[name=expYear]').type('29')
    cy.get('input[name=securityCode]').type('123')
    cy.get('label[for="country"]')
      // Utilize / test autocomplete
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

    getTestAnchor('credits-success-action', { timeout: 20_000 })
    cy.url().should('include', '#unified-payment-success')
    getTestAnchor('credits-success-action', { timeout: 20_000 }).click()
    cy.url({ timeout: 20_000 }).should('include', '/pack-opening/')
    getTestAnchor('pack-opening-action', { timeout: 20_000 }).click()

    // Very long timeout here to ensure the pack gets transferred
    getTestAnchor('transfer-success-button', { timeout: 30_000 }).click()
    cy.url({ timeout: 20_000 }).should('include', '/my/collectibles')
  })
}
