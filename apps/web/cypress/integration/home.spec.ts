describe('home page', () => {
  it('renders some content', () => {
    cy.visit('/')
    cy.get('h1').contains('Eric Clapton')
  })
})
