describe('home', () => {
  it('should navigate to home page', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/')
  })
})
