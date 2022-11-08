import login from '@/fragments/login.cy'
import logout from '@/fragments/logout.cy'
import purchaseCredits from '@/fragments/purchaseCredits.cy'
import purchasePackCredits from '@/fragments/purchasePackCredits.cy'
import purchasePackNoCredits from '@/fragments/purchasePackIntegrated.cy'
import { getTestAnchor } from '@/support/utils'

describe('full flow', async () => {
  const baseURL = Cypress.env('BASE_URL')
  const email = Cypress.env('EMAIL')
  const username = Cypress.env('USERNAME')
  const password = Cypress.env('PASSWORD')

  before(() => {
    cy.cleanupUsers(email, username)
  })
  beforeEach(() =>
    cy.setCookie('algoFanSettings', Cypress.env('BETA_ACCESS_CODE'))
  )
  after(() => {
    cy.cleanupUsers(email, username)
  })

  it('should allow a user to sign up (e-mail)', () => {
    cy.visit(`${baseURL}`)
    cy.location('pathname').should('eq', '/')

    getTestAnchor('main-nav-join-now-link').click()

    cy.location('pathname').should('include', '/signup-email')

    cy.get('input[name=email]').type(email)
    cy.get('input[name=username]').type(username)
    cy.get('input[name=password]').type(password)
    cy.get('input[name=privacyPolicy]').click()
    cy.get('input[name=tos]').click()
    cy.get('form').submit()

    // Timeout to ensure form submits & data is returned
    cy.location('pathname', { timeout: 10_000 }).should('eq', '/')

    // Prompt should be visible
    getTestAnchor('email-not-verified-prompt')

    // Manually handle the email verification
    cy.verifyEmail(email)
    getTestAnchor('refresh-email-verification').click()

    // Prompt should not exist
    getTestAnchor('email-not-verified-prompt', { shouldExist: false })
  })

  logout()

  login(email, password)

  purchasePackNoCredits()

  purchaseCredits()

  purchasePackCredits()
})
