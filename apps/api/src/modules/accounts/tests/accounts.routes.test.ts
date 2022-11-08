import { AlgorandTransactionStatus, UserAccountStatus } from '@algomart/schemas'
import {
  AlgorandAdapter,
  IpGeolocationAdapter,
} from '@algomart/shared/adapters'
import {
  fakeAddressFor,
  setupTestDatabase,
  teardownTestDatabase,
} from '@algomart/shared/tests'
import {
  algorandAccountFactory,
  algorandTransactionFactory,
  userAccountFactory,
} from '@algomart/shared/tests'
import { buildTestApp } from '@api-tests/build-test-app'
import { FastifyInstance } from 'fastify'

let app: FastifyInstance
beforeEach(async () => {
  await setupTestDatabase('accounts_test_db', { returnKnex: false })
  app = await buildTestApp('accounts_test_db')
})

afterEach(async () => {
  await app.close()
  await teardownTestDatabase('accounts_test_db')
})

test('POST /accounts OK', async () => {
  // Arrange
  const address = fakeAddressFor('account')
  const username = 'account'
  const encryptedMnemonic = 'encryptedMnemonic'

  const userAccount = userAccountFactory.build({
    username,
  })

  jest.spyOn(AlgorandAdapter.prototype, 'generateAccount').mockResolvedValue({
    address,
    encryptedMnemonic,
    signedTransactions: [],
    transactionIds: [],
  })

  jest
    .spyOn(IpGeolocationAdapter.prototype, 'getCountryCodeByIpAddress')
    .mockResolvedValue('USA')

  // Act
  const { body, statusCode, headers } = await app.inject({
    method: 'POST',
    url: '/accounts',
    headers: {
      authorization: `Bearer test-api-key:${username}:${userAccount.externalId}`,
    },
    payload: {
      balance: userAccount.balance,
      currency: userAccount.currency,
      email: userAccount.email,
      externalId: userAccount.externalId,
      language: userAccount.language,
      verificationStatus: userAccount.verificationStatus,
      provider: userAccount.provider,
      username,
    },
  })

  // Assert
  expect(statusCode).toBe(201)
  expect(headers['content-type']).toMatch(/application\/json/)
  const { id, ...json } = JSON.parse(body) // eslint-disable-line @typescript-eslint/no-unused-vars
  expect(json).toEqual({
    address,
    applicantId: null,
    age: null,
    balance: userAccount.balance,
    currency: userAccount.currency,
    email: userAccount.email,
    externalId: userAccount.externalId,
    lastWorkflowRunId: null,
    verificationStatus: UserAccountStatus.Unverified,
    language: userAccount.language,
    provider: userAccount.provider,
    showProfile: false,
    username,
    watchlistMonitorId: null,
  })
})

test('GET /accounts OK', async () => {
  // Arrange
  const username = 'externalId'

  const creationTransaction = algorandTransactionFactory.build({
    status: AlgorandTransactionStatus.Confirmed,
  })
  await app.knex('AlgorandTransaction').insert(creationTransaction)
  const algorandAccount = algorandAccountFactory.build(
    {},
    {
      creationTransaction,
    }
  )
  await app.knex('AlgorandAccount').insert(algorandAccount)
  const userAccount = userAccountFactory.build(
    {
      username,
    },
    {
      algorandAccount,
    }
  )
  await app.knex('UserAccount').insert(userAccount)

  // Act
  const { body, statusCode, headers } = await app.inject({
    method: 'GET',
    url: '/accounts',
    headers: {
      authorization: `Bearer test-api-key:${username}:${userAccount.externalId}`,
    },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toMatch(/application\/json/)
  const json = JSON.parse(body)
  expect(json).toEqual({
    address: algorandAccount.address,
    age: null,
    balance: 0,
    currency: userAccount.currency,
    email: userAccount.email,
    externalId: userAccount.externalId,
    applicantId: null,
    lastWorkflowRunId: null,
    verificationStatus: UserAccountStatus.Unverified,
    lastVerified: userAccount.lastVerified,
    id: userAccount.id,
    language: userAccount.language,
    provider: userAccount.provider,
    showProfile: false,
    status: AlgorandTransactionStatus.Confirmed,
    username,
    watchlistMonitorId: null,
  })
})

// TODO: add test cases for various errors...
