interface TestAnchorAttributes {
  timeout?: number
  shouldExist?: boolean
}

export const getTestAnchor = (
  dataValue: string,
  attributes: TestAnchorAttributes = {}
) => {
  const { timeout, shouldExist = true } = attributes

  return cy
    .get(`[data-e2e="${dataValue}"]`, timeout ? { timeout } : undefined)
    .should(shouldExist ? 'be.visible' : 'not.exist')
}

// These are super simple functions currently, but the goal is to abstract the logic
// in case it becomes more complex in the future
export const secondUser = (user: string) => (user ? `${user}2` : '')
export const secondEmail = (email: string) =>
  email ? email.replace('@', '+2@') : ''
