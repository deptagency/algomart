import Serialize from 'fast-json-stringify'

import { UserAccount, UserAccountSchema, UserAccountStatus } from './accounts'

test('serialize account schemas', () => {
  const serializer = Serialize(UserAccountSchema)
  expect(
    serializer({
      algorandAccountId: 'b8d510b9-75a2-5d90-97fd-6a985ee2e4dc',
      externalId: 'd111e39c-598e-545d-9ded-b221b326e77f',
      verificationStatus: UserAccountStatus.Approved,
    } as UserAccount)
  ).toBeDefined()
})
