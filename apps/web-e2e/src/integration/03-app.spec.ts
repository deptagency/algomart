describe('home', () => {
  it('should navigate to home page', () => {
    cy.setCookie('cookie-consent', '1')
    cy.visit('/')
    cy.location('pathname').should('eq', '/')
  })
})
