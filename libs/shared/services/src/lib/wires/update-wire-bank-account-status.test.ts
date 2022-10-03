import {
  AlgorandTransactionStatus,
  CircleWireBankAccount,
  CircleWireBankAccountStatus,
  UserAccount,
  UserAccountStatus,
} from '@algomart/schemas'
import { WireBankAccountModel } from '@algomart/shared/models'
import { WiresService } from '@algomart/shared/services'
import {
  createUserAccount,
  createWireBankAccount,
  setupTestDatabase,
  teardownTestDatabase,
} from '@algomart/shared/tests'
import { DependencyResolver } from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { Knex } from 'knex'
import { Model } from 'objection'

import { closeQueues, configureTestResolver } from '../test/mock-resolver'

let knex: Knex
let resolver: DependencyResolver
let wiresService: WiresService
let userAccount: UserAccount
const testingDatabaseName = 'wires_service_update_status_test_db'

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

describe('WiresService.updateWireBankAccountStatus', () => {
  test('happy path', async () => {
    // Arrange
    const wireBankAccountBefore = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      accountNumber: null,
      routingNumber: null,
      iban: 'DE31100400480532013000',
      default: true,
      isSaved: true,
    })

    // Act
    await wiresService.updateWireBankAccountStatus({
      id: wireBankAccountBefore.externalId,
      status: CircleWireBankAccountStatus.Failed,
    } as CircleWireBankAccount)

    // Assert
    const wireBankAccountAfter = await WireBankAccountModel.query().findById(
      wireBankAccountBefore.id
    )
    expect(wireBankAccountAfter).toBeTruthy()
    expect(wireBankAccountAfter.status).toBe(CircleWireBankAccountStatus.Failed)
  })

  // A (recoverable) error should be thrown if we cant find the bank account
  test('Bank Account Not Found', async () => {
    // Arrange
    const wireBankAccountBefore = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      accountNumber: null,
      routingNumber: null,
      iban: 'DE31100400480532013000',
      default: true,
      isSaved: true,
    })

    // Act
    let caughtError
    try {
      await wiresService.updateWireBankAccountStatus({
        id: 'FOOOBAR',
        status: CircleWireBankAccountStatus.Failed,
      } as CircleWireBankAccount)
    } catch (error) {
      caughtError = error
    }

    // Assert
    expect(caughtError).toBeTruthy()
    expect(caughtError instanceof UnrecoverableError).toBe(false)

    const wireBankAccountAfter = await WireBankAccountModel.query().findById(
      wireBankAccountBefore.id
    )
    expect(wireBankAccountAfter).toBeTruthy()
    expect(wireBankAccountAfter.status).toBe(
      CircleWireBankAccountStatus.Pending
    )
  })
})
