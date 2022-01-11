import { getGreeting } from '../support/app.po'

describe('web', () => {
  // beforeEach(() => cy.visit('/'))

  it('should display welcome message', () => {
    cy.visit('/checkout/1')
    // Custom command example, see `../support/commands.ts` file
    // cy.login('my-email@something.com', 'myPassword')

    // Function helper example, see `../support/app.po.ts` file
    // getGreeting().contains('Welcome web')
  })
})
