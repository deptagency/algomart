import { stringify } from 'query-string'

describe('releases page', () => {
  it('should render', () => {
    cy.visit('/releases')
    cy.location('pathname').should('eq', '/releases')
    cy.get('input[value="Newest"]').should('exist')
    cy.get('[href="/releases/pack-7"]').should('be.visible')
  })
  it('should respect filter query params', () => {
    const query = {
      priceHigh: '45600',
      priceLow: '123',
      sortMode: 'Oldest',
      showAuction: 'true',
      showPurchase: 'false',
      showAuctionUpcoming: 'false',
      showAuctionActive: 'false',
      showAuctionExpired: 'false',
      showAuctionReserveMet: 'true',
    }
    cy.visit(`/releases?${stringify(query)}`)
    cy.location('pathname').should('eq', '/releases')
    cy.get('input[value="$1.23"]').should('exist')
    cy.get('input[value="$456.00"]').should('exist')
    cy.get('input[value="Oldest"]').should('exist')
    cy.get('button[aria-checked="false"]').contains('Purchase').should('exist')
    cy.get('button[aria-checked="true"]').contains('Auction').should('exist')
    cy.get('button[aria-checked="false"]')
      .contains('Starting soon')
      .should('exist')
    cy.get('button[aria-checked="false"]')
      .contains('Auction is live')
      .should('exist')
    cy.get('button[aria-checked="false"]').contains('Has ended').should('exist')
    cy.get('button[aria-checked="true"]')
      .contains('Reserve met')
      .should('exist')
  })
})
