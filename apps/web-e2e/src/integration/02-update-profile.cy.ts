import login from '@/fragments/login.cy'
import { getTestAnchor } from '@/support/utils'

describe('update profile  ', () => {
  const baseURL = Cypress.env('BASE_URL')
  const email = Cypress.env('EMAIL')
  const username = Cypress.env('USERNAME')
  const password = Cypress.env('PASSWORD')

  before(() => {
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

  it("should be able to update an existing user's profile", () => {
    cy.visit(baseURL)
    cy.location('pathname').should('eq', '/')

    getTestAnchor('nav-menu-open-button').click()
    getTestAnchor('user-menu')
    getTestAnchor('user-menu-my-profile').click()
    cy.location('pathname').should('eq', '/my/profile')
    getTestAnchor('profile-currency').within(() => {
      cy.get('input[role="combobox"]').should('not.be.disabled').type('EU')
    })
    cy.get('li[role="option"]').contains('EUR').should('be.visible').click()
    getTestAnchor('profile-update-success')
  })
})
