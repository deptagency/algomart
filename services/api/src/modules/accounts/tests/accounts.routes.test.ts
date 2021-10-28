import { AlgorandTransactionStatus } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import { buildTestApp } from 'test/build-test-app'
import { fakeAddressFor } from 'test/setup-tests'

import AlgorandAdapter from '@/lib/algorand-adapter'
import {
  algorandAccountFactory,
  algorandTransactionFactory,
  userAccountFactory,
} from '@/seeds/seed-test-data'

let app: FastifyInstance

beforeEach(async () => {
  app = await buildTestApp()
})

afterEach(async () => {
  await app.close()
})

test('POST /accounts OK', async () => {
  // Arrange
  const address = fakeAddressFor('account')
  const transactionId = fakeAddressFor('transaction')
  const passphrase = '000000'
  const username = 'account'
  const encryptedMnemonic = 'encryptedMnemonic'

  const userAccount = userAccountFactory.build({
    username,
  })

  jest.spyOn(AlgorandAdapter.prototype, 'createAccount').mockResolvedValue({
    address,
    encryptedMnemonic,
    signedTransactions: [new Uint8Array(0), new Uint8Array(0)],
    transactionIds: [transactionId, fakeAddressFor('transaction')],
  })

  jest.spyOn(AlgorandAdapter.prototype, 'submitTransaction').mockResolvedValue()
  jest
    .spyOn(AlgorandAdapter.prototype, 'waitForConfirmation')
    .mockResolvedValue({
      assetIndex: 0,
      confirmedRound: 1,
      poolError: '',
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
      externalId: userAccount.externalId,
      email: userAccount.email,
      locale: userAccount.locale,
      passphrase,
      waitForConfirmation: true,
    },
  })

  // Assert
  expect(statusCode).toBe(201)
  expect(headers['content-type']).toMatch(/application\/json/)
  const json = JSON.parse(body)
  expect(json).toEqual({
    address,
    username,
    externalId: userAccount.externalId,
    showProfile: false,
    email: userAccount.email,
    locale: userAccount.locale,
    status: AlgorandTransactionStatus.Confirmed,
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
    username,
    externalId: userAccount.externalId,
    showProfile: false,
    email: userAccount.email,
    locale: userAccount.locale,
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
    .mockReturnValue(true)

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
    .mockReturnValue(false)

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
