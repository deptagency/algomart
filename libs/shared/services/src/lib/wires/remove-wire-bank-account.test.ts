import {
  AlgorandTransactionStatus,
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
import { Knex } from 'knex'
import { Model } from 'objection'
import { v4 } from 'uuid'

import { closeQueues, configureTestResolver } from '../test/mock-resolver'

let knex: Knex
let resolver: DependencyResolver
let wiresService: WiresService
let userAccount: UserAccount
const testingDatabaseName = 'wires_service_remove_wire_bank_account_test_db'

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

describe('WiresService.removeWireBankAccount', () => {
  test('happy path', async () => {
    // Arrange
    const preexistingBankAccount1 = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: true,
      isSaved: true,
    })
    const preexistingBankAccount2 = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: false,
      isSaved: true,
    })

    // Act
    await wiresService.removeWireBankAccount(
      userAccount,
      preexistingBankAccount1.id
    )

    // Assert
    const updatedBankAccount1 = await WireBankAccountModel.query().findById(
      preexistingBankAccount1.id
    )
    const updatedBankAccount2 = await WireBankAccountModel.query().findById(
      preexistingBankAccount2.id
    )
    expect(updatedBankAccount1.isSaved).toBe(false)
    expect(updatedBankAccount2.isSaved).toBe(true)
  })

  test('bank account not found', async () => {
    // Arrange
    const preexistingBankAccount1 = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: true,
      isSaved: true,
    })
    const preexistingBankAccount2 = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: false,
      isSaved: true,
    })

    const badId = await v4()

    // Act
    let caughtError
    try {
      await wiresService.removeWireBankAccount(userAccount, badId)
    } catch (error) {
      caughtError = error
    }

    // Assert
    expect(caughtError).toBeTruthy()
    expect(caughtError.statusCode).toBe(404)

    const updatedBankAccount1 = await WireBankAccountModel.query().findById(
      preexistingBankAccount1.id
    )
    const updatedBankAccount2 = await WireBankAccountModel.query().findById(
      preexistingBankAccount2.id
    )
    expect(updatedBankAccount1.isSaved).toBe(true)
    expect(updatedBankAccount2.isSaved).toBe(true)
  })
})
