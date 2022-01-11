describe('checkout page for card payments', () => {
  beforeEach(() => cy.visit('/checkout/1/card'))

  it('should display welcome message', () => {
    // Shows purchase header
    // Check basic form details
  })

  it('should display card form', () => {
    // Shows new card form + fields
  })

  it('should display existing cards if available', () => {
    // Populate db
    // Check if shows existing cards
  })

  it('should be able to submit form with a new card', () => {
    // Fill out new card details
    // Proceed to the summary page
    // Submit form
    // Check success
  })

  it('should be able to submit form with an existing card', () => {
    // Populate db
    // Select a new card from dropdown
    // Proceed to the summary page
    // Submit form
    // Check success
  })

  it('should be kicked back to the checkout', () => {
    // Fill out invalid details
    // Check if kicked back to details page with error
  })
})
