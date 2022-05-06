import { AlgorandTransactionStatus } from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  algorandAccountFactory,
  algorandTransactionFactory,
  userAccountFactory,
} from '@api/seeds/seed-test-data'
import { buildTestApp } from '@api-tests/build-test-app'
import {
  fakeAddressFor,
  setupTestDatabase,
  teardownTestDatabase,
} from '@api-tests/setup-tests'
import { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeEach(async () => {
  await setupTestDatabase('accounts_test_db')
  app = await buildTestApp('accounts_test_db')
})

afterEach(async () => {
  await app.close()
  await teardownTestDatabase('accounts_test_db')
})

test('POST /accounts OK', async () => {
  // Arrange
  const address = fakeAddressFor('account')
  const passphrase = '000000'
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

  // Act
  const { body, statusCode, headers } = await app.inject({
    method: 'POST',
    url: '/accounts',
    headers: {
      authorization: 'Bearer test-api-key',
    },
    payload: {
      username,
      currency: userAccount.currency,
      externalId: userAccount.externalId,
      email: userAccount.email,
      language: userAccount.language,
      passphrase,
    },
  })

  // Assert
  expect(statusCode).toBe(201)
  expect(headers['content-type']).toMatch(/application\/json/)
  const json = JSON.parse(body)
  expect(json).toEqual({
    address,
    currency: userAccount.currency,
    username,
    externalId: userAccount.externalId,
    showProfile: false,
    email: userAccount.email,
    language: userAccount.language,
  })
})

test('GET /accounts/:externalId OK', async () => {
  // Arrange
  const username = 'external_id'

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
    url: `/accounts/${userAccount.externalId}`,
    headers: {
      authorization: 'Bearer test-api-key',
    },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(headers['content-type']).toMatch(/application\/json/)
  const json = JSON.parse(body)
  expect(json).toEqual({
    address: algorandAccount.address,
    currency: userAccount.currency,
    username,
    externalId: userAccount.externalId,
    showProfile: false,
    email: userAccount.email,
    language: userAccount.language,
    status: AlgorandTransactionStatus.Confirmed,
  })
})

test('POST /accounts/:externalId/verify-passphrase (Valid passphrase)', async () => {
  // Arrange
  const username = 'valid_pass'
  const passphrase = '000000'

  const creationTransaction = algorandTransactionFactory.build({
    status: AlgorandTransactionStatus.Confirmed,
  })
  await app.knex('AlgorandTransaction').insert(creationTransaction)
  const algorandAccount = algorandAccountFactory.build(
    {},
    { passphrase, creationTransaction }
  )
  await app.knex('AlgorandAccount').insert(algorandAccount)
  const userAccount = userAccountFactory.build(
    { username },
    { algorandAccount }
  )
  await app.knex('UserAccount').insert(userAccount)

  jest
    .spyOn(AlgorandAdapter.prototype, 'isValidPassphrase')
    .mockResolvedValue(true)

  // Act
  const { body, statusCode } = await app.inject({
    method: 'POST',
    url: `/accounts/${userAccount.externalId}/verify-passphrase`,
    headers: { authorization: 'Bearer test-api-key' },
    payload: { passphrase },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(JSON.parse(body)).toEqual({ isValid: true })
})

test('POST /accounts/:externalId/verify-passphrase (Invalid passphrase)', async () => {
  // Arrange
  const username = 'invalid_pass'
  const passphrase = '000000'

  const creationTransaction = algorandTransactionFactory.build({
    status: AlgorandTransactionStatus.Confirmed,
  })
  await app.knex('AlgorandTransaction').insert(creationTransaction)
  const algorandAccount = algorandAccountFactory.build(
    {},
    { passphrase, creationTransaction }
  )
  await app.knex('AlgorandAccount').insert(algorandAccount)
  const userAccount = userAccountFactory.build(
    { username },
    { algorandAccount }
  )
  await app.knex('UserAccount').insert(userAccount)

  jest
    .spyOn(AlgorandAdapter.prototype, 'isValidPassphrase')
    .mockResolvedValue(false)

  // Act
  const { body, statusCode } = await app.inject({
    method: 'POST',
    url: `/accounts/${userAccount.externalId}/verify-passphrase`,
    headers: { authorization: 'Bearer test-api-key' },
    payload: { passphrase },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(JSON.parse(body)).toEqual({ isValid: false })
})

test('POST /accounts/verify-username (Available username)', async () => {
  // Arrange
  const externalId = 'available'
  const passphrase = '000000'

  const creationTransaction = algorandTransactionFactory.build({
    status: AlgorandTransactionStatus.Confirmed,
  })
  await app.knex('AlgorandTransaction').insert(creationTransaction)
  const algorandAccount = algorandAccountFactory.build(
    {},
    { passphrase, creationTransaction }
  )
  await app.knex('AlgorandAccount').insert(algorandAccount)
  const userAccount = userAccountFactory.build(
    { username: externalId, externalId },
    { algorandAccount }
  )
  await app.knex('UserAccount').insert(userAccount)

  // Act
  const { body, statusCode } = await app.inject({
    method: 'POST',
    url: '/accounts/verify-username',
    headers: { authorization: 'Bearer test-api-key' },
    payload: { username: 'another_username' },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(JSON.parse(body)).toEqual({ isAvailable: true })
})

test('POST /accounts/verify-username (Unavailable username)', async () => {
  // Arrange
  const externalId = 'unavailable'
  const passphrase = '000000'

  const creationTransaction = algorandTransactionFactory.build({
    status: AlgorandTransactionStatus.Confirmed,
  })
  await app.knex('AlgorandTransaction').insert(creationTransaction)
  const algorandAccount = algorandAccountFactory.build(
    {},
    { passphrase, creationTransaction }
  )
  await app.knex('AlgorandAccount').insert(algorandAccount)
  const userAccount = userAccountFactory.build(
    { username: externalId, externalId },
    { algorandAccount }
  )
  await app.knex('UserAccount').insert(userAccount)

  // Act
  const { body, statusCode } = await app.inject({
    method: 'POST',
    url: '/accounts/verify-username',
    headers: { authorization: 'Bearer test-api-key' },
    payload: { username: userAccount.username },
  })

  // Assert
  expect(statusCode).toBe(200)
  expect(JSON.parse(body)).toEqual({ isAvailable: false })
})

// TODO: add test cases for various errors...
