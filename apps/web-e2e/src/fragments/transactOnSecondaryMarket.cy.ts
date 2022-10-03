import { getTestAnchor } from '@/support/utils'
export default (transactionType: 'sell' | 'cancel') => {
  const baseURL = Cypress.env('BASE_URL')
  const shouldSell = transactionType === 'sell'

  it(`should allow a user to ${transactionType} a collectible on the secondary marketplace`, () => {
    cy.visit(baseURL)

    // wait for app to register that the user is logged in
    getTestAnchor('nav-menu-open-button')

    getTestAnchor(`main-nav-My Collection-link`).click()
    getTestAnchor('collectible-action-button', { timeout: 20_000 }).click()
    getTestAnchor('collectible-action-menu-transact').click()
    getTestAnchor(
      shouldSell
        ? 'list-for-secondary-marketplace-sale'
        : 'cancel-listing-button'
    ).click()
    getTestAnchor('back-to-collection').click()
    cy.location('pathname').should('eq', '/my/collectibles')
    cy.reload() // This reloads helps ensure the 'For Sale' banner state is as expected
    getTestAnchor('collectible-listed-banner', {
      timeout: 10_000,
      shouldExist: shouldSell,
    })
  })
}
