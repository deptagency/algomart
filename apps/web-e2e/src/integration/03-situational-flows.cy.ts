// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import login from '@/fragments/login.cy'
import logout from '@/fragments/logout.cy'
import purchaseCredits from '@/fragments/purchaseCredits.cy'
import purchasePackNoCredits from '@/fragments/purchasePackIntegrated.cy'
import transactOnSecondaryMarket from '@/fragments/transactOnSecondaryMarket.cy'
import { getTestAnchor, secondEmail } from '@/support/utils'

describe('situational flows', async () => {
  const baseURL = Cypress.env('BASE_URL')
  const email = Cypress.env('EMAIL')
  const username = Cypress.env('USERNAME')
  const password = Cypress.env('PASSWORD')
  const testNFTSlug = Cypress.env('TEST_NFT_SLUG')

  before(() => {
    indexedDB.deleteDatabase('firebaseLocalStorageDb')

    cy.cleanupUsers(email, username)
    cy.createUsers(email, password, username)
  })
  beforeEach(() =>
    cy.setCookie('algoFanSettings', Cypress.env('BETA_ACCESS_CODE'))
  )
  after(() => {
    cy.cleanupUsers(email, username)
  })

  login(email, password)

  purchasePackNoCredits()

  transactOnSecondaryMarket('sell')

  transactOnSecondaryMarket('cancel')

  transactOnSecondaryMarket('sell')

  logout()

  login(secondEmail(email), password)

  purchaseCredits()

  it('should allow a user to purchase a collectible from the secondary marketplace', () => {
    cy.visit(baseURL)
    getTestAnchor(`main-nav-Marketplace-link`).click()
    cy.get(`a[href="/marketplace/${testNFTSlug}"]`).should('be.visible').click()
    getTestAnchor(`collectible-action-buy`).click()
    getTestAnchor(`credits-form-buy`).click()
    getTestAnchor(`credits-success-action`, { timeout: 30_000 }).click()
    cy.location('pathname').should('eq', '/my/collectibles')
  })
})
