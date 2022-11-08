import { getTestAnchor } from '@/support/utils'

export default () => {
  const baseURL = Cypress.env('BASE_URL')
  const testPackSlug = Cypress.env('TEST_PACK_SLUG')

  it('should allow a logged-in user to purchase a pack with credits', () => {
    cy.visit(baseURL)
    getTestAnchor(`main-nav-Drops-link`).click()
    cy.get(`a[href="/drops/${testPackSlug}"]`).should('be.visible').click()
    cy.location('pathname').should('eq', `/drops/${testPackSlug}`)
    getTestAnchor('pack-template-info')
    getTestAnchor('buy-now-button').click()
    cy.location('pathname', { timeout: 20_000 }).should(
      'eq',
      `/checkout/pack/${testPackSlug}`
    )
    getTestAnchor('credits-form-buy').click()
    cy.url({ timeout: 20_000 }).should('include', '#credits-payment-success')
    getTestAnchor('credits-success-action', { timeout: 20_000 }).click()
    cy.url({ timeout: 20_000 }).should('include', '/pack-opening/')
    getTestAnchor('pack-opening-action', { timeout: 20_000 }).click()

    // Very long timeout here to ensure the pack gets transferred
    getTestAnchor('transfer-success-button', { timeout: 30_000 }).click()
    cy.url({ timeout: 20_000 }).should('include', '/my/collectibles')
  })
}
