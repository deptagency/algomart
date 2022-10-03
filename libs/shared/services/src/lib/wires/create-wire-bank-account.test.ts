import {
  AlgorandTransactionStatus,
  CreateWireBankAccountRequest,
  UserAccount,
  UserAccountStatus,
} from '@algomart/schemas'
import { WireBankAccountModel } from '@algomart/shared/models'
import { SubmitWireBankAccountQueue } from '@algomart/shared/queues'
import { WiresService } from '@algomart/shared/services'
import {
  createUserAccount,
  createWireBankAccount,
  setupTestDatabase,
  teardownTestDatabase,
  wireBankAccountFactory,
} from '@algomart/shared/tests'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'

import { closeQueues, configureTestResolver } from '../test/mock-resolver'

let knex: Knex
let resolver: DependencyResolver
let wiresService: WiresService
let userAccount: UserAccount
const testingDatabaseName = 'wires_service_create_wire_bank_account_test_db'

const baseUserAccount = {
  id: 'testId',
  email: 'test@test.com',
  externalId: 'testExternalId',
  username: 'testUn',
  balance: 100,
  status: AlgorandTransactionStatus.Confirmed,
  verificationStatus: UserAccountStatus.Unverified,
}

beforeEach(async () => {
  knex = await setupTestDatabase(testingDatabaseName)
  Model.knex(knex)
  jest.restoreAllMocks()
  resolver = configureTestResolver()
  wiresService = resolver.get<WiresService>(WiresService.name)
  ;({ userAccount } = await createUserAccount(knex, baseUserAccount))
})

afterEach(async () => {
  await closeQueues(resolver)
  resolver.clear()
  await teardownTestDatabase(testingDatabaseName, knex)
})

describe('WiresService.createWireBankAccount', () => {
  // eslint-disable-next-line jest/expect-expect
  test('happy path: IBAN, saved, default', async () => {
    await testHappyPathCreateBankAccount({
      iban: '123456789',
      default: true,
      isSaved: true,
    })
  })

  // eslint-disable-next-line jest/expect-expect
  test('happy path: US/ Other, not saved, not default', async () => {
    await testHappyPathCreateBankAccount({
      accountNumber: '123456789',
      routingNumber: '123456789',
      default: false,
      isSaved: true,
    })
  })

  // If we're unable to queue a submit-wire-bank-account job, the row should be deleted
  test('Unable to queue submit-wire-bank-account job', async () => {
    // Arrange
    const preexistingDefaultBankAccount = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: true,
    })

    const queue = resolver.get<SubmitWireBankAccountQueue>(
      SubmitWireBankAccountQueue.name
    )
    const queueBeforeCount = await queue.getCount()
    const enqueueError = new Error('BAD CONNECTION')
    jest.spyOn(queue, 'enqueue').mockImplementation(async () => {
      throw enqueueError
    })

    const mockBankAccount = wireBankAccountFactory.build({
      accountNumber: null,
      routingNumber: null,
      iban: '12345678',
      default: true,
      isSaved: false,
    })

    // Act
    let caughtError = null
    try {
      await wiresService.createBankAccount(userAccount, {
        iban: mockBankAccount.iban,
        accountNumber: mockBankAccount.accountNumber,
        routingNumber: mockBankAccount.routingNumber,
        billingDetails: mockBankAccount.billingDetails,
        bankAddress: mockBankAccount.bankAddress,
        default: mockBankAccount.default,
        isSaved: mockBankAccount.isSaved,
      } as CreateWireBankAccountRequest)
    } catch (error) {
      caughtError = error
    }

    // Assert
    expect(caughtError).toBeTruthy()
    expect(await queue.getCount()).toBe(queueBeforeCount)
    const allWireBankAccounts = await WireBankAccountModel.query().select()
    expect(allWireBankAccounts.length).toBe(1)
    expect(allWireBankAccounts[0].id).toBe(preexistingDefaultBankAccount.id)
  })
})

// Reused for IBAN/ US/ OTHER
async function testHappyPathCreateBankAccount(params: {
  accountNumber?: string
  routingNumber?: string
  iban?: string
  default: boolean
  isSaved: boolean
}) {
  // Arrange
  const preexistingDefaultBankAccount = await createWireBankAccount(knex, {
    ownerId: userAccount.id,
    default: true,
  })

  const mockBankAccount = wireBankAccountFactory.build({
    accountNumber: params.accountNumber ?? null,
    routingNumber: params.routingNumber ?? null,
    iban: params.iban ?? null,
    default: params.default,
    isSaved: params.isSaved,
  })

  const queue = resolver.get<SubmitWireBankAccountQueue>(
    SubmitWireBankAccountQueue.name
  )
  const queueBeforeCount = await queue.getCount()

  // Act
  const result = await wiresService.createBankAccount(userAccount, {
    iban: mockBankAccount.iban,
    accountNumber: mockBankAccount.accountNumber,
    routingNumber: mockBankAccount.routingNumber,
    billingDetails: mockBankAccount.billingDetails,
    bankAddress: mockBankAccount.bankAddress,
    default: mockBankAccount.default,
    isSaved: mockBankAccount.isSaved,
  } as CreateWireBankAccountRequest)

  // Assert
  const wireBankAccount = await WireBankAccountModel.query().findById(result.id)
  expect(wireBankAccount).toBeTruthy()
  const rowPropsExpectedToMatch = [
    'iban',
    'default',
    'isSaved',
    'billingDetails',
    'bankAddress',
  ]
  for (const property of rowPropsExpectedToMatch) {
    expect(wireBankAccount[property]).toEqual(mockBankAccount[property])
  }

  const updatedPreexistingWireBankAccount =
    await WireBankAccountModel.query().findById(
      preexistingDefaultBankAccount.id
    )
  expect(updatedPreexistingWireBankAccount.default).toBe(!params.default)

  expect(await queue.getCount()).toBe(queueBeforeCount + 1)
}
