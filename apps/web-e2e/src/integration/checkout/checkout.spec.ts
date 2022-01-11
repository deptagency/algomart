describe('checkout page', () => {
  beforeEach(() => cy.visit('/checkout/1'))

  it('should display welcome message', () => {
    console.log('test')
    // Custom command example, see `../support/commands.ts` file
    // cy.login('my-email@something.com', 'myPassword')

    // Function helper example, see `../support/app.po.ts` file
    // getGreeting().contains('Welcome web')
  })

  it('should display all available payment methods', () => {
    // ul of 3 li elements
    // h2 => Credit Card
    // p => Accepted for winning bids up to $3,000
    // h2 => Bank Wire Transfer
    // p => Accepted for all winning bids
    // h2 => Crypto Wallet
    // p => Accepted for all winning bids. Payment accepted in USDC from WalletConnect, MyAlgo, or Coinbase.
    // Check if env variable exists => only show wire / crypto if set:
    // NEXT_PUBLIC_WIRE_PAYMENT_ENABLED
    // NEXT_PUBLIC_CRYPTO_PAYMENT_ENABLED
  })

  it('should be able to select card payments', () => {
    // h2 => Credit Card
    // p => Accepted for winning bids up to $3,000
    // Navigates to correct page (i.e., `checkout/1/card?step=details`)
  })

  it('should be able to select wire payments', () => {
    // h2 => Bank Wire Transfer
    // p => Accepted for all winning bids
    // Navigates to correct page (i.e., `checkout/1/wire?step=details`)
  })

  it('should be able to select crypto payments', () => {
    // h2 => Crypto Wallet
    // p => Accepted for all winning bids. Payment accepted in USDC from WalletConnect, MyAlgo, or Coinbase.
    // Navigates to correct page (i.e., `checkout/1/crypto?step=details`)
  })
})
