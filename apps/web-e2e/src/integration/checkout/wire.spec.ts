describe('checkout page for wire payments', () => {
  beforeEach(() => cy.visit('/checkout/1/wire'))

  it('should display header', () => {
    // Shows basic details on page
  })

  it('should display bank account form', () => {
    // Shows new wires form + fields
  })

  it('should be able to submit form with a new bank account', () => {
    // Fill out new bank account details
    // Proceed to the summary page
    // Submit form
    // Check success
  })

  it('should be kicked back to the checkout when invalid details are submitted', () => {
    // Fill out new bank account details => use invalid details
    // Proceed to the summary page
    // Submit form
    // Check failure
  })
})
