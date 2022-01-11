describe('checkout page for crypto payments', () => {
  beforeEach(() => cy.visit('/checkout/1/crypto'))

  it('should display header and instructions on wallet transfers', () => {
    // Shows details on page
  })

  it('should display instructional modal when prompted', () => {
    // Open the instructional modal
    // Check details
    // Close modal
  })

  it('should open QR modal when prompted', () => {
    // Try to connect to your wallet
    // Check QR code is displayed
  })

  it('should find the transfer when available', () => {
    // Populate db
    // Check for transfers
    // Confirm success screen is shown
  })
})
