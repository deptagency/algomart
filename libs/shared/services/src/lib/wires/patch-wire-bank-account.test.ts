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
const testingDatabaseName = 'wires_service_patch_wire_bank_account_test_db'

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

describe('WiresService.updateWireBankAccount', () => {
  test('mark as default', async () => {
    // Arrange
    const preexistingDefaultBankAccount = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: true,
    })
    const preexistingNonDefaultBankAccount = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: false,
    })

    // Act
    await wiresService.updateWireBankAccount(
      userAccount,
      preexistingNonDefaultBankAccount.id,
      { default: true }
    )

    // Assert
    const updatedNonDefault = await WireBankAccountModel.query().findById(
      preexistingNonDefaultBankAccount.id
    )
    const updatedDefault = await WireBankAccountModel.query().findById(
      preexistingDefaultBankAccount.id
    )
    expect(updatedNonDefault.default).toBe(true)
    expect(updatedDefault.default).toBe(false)
  })

  test('mark as not-default', async () => {
    // Arrange
    const preexistingDefaultBankAccount = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: true,
    })
    const preexistingNonDefaultBankAccount = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: false,
    })

    // Act
    await wiresService.updateWireBankAccount(
      userAccount,
      preexistingNonDefaultBankAccount.id,
      { default: false }
    )

    // Assert
    const updatedNonDefault = await WireBankAccountModel.query().findById(
      preexistingNonDefaultBankAccount.id
    )
    const updatedDefault = await WireBankAccountModel.query().findById(
      preexistingDefaultBankAccount.id
    )
    expect(updatedNonDefault.default).toBe(false)
    expect(updatedDefault.default).toBe(true)
  })

  test('bank account not found', async () => {
    // Arrange
    await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: true,
    })
    await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      default: false,
    })

    const badId = await v4()

    // Act
    let caughtError
    try {
      await wiresService.updateWireBankAccount(userAccount, badId, {
        default: false,
      })
    } catch (error) {
      caughtError = error
    }

    // Assert
    expect(caughtError).toBeTruthy()
    expect(caughtError.statusCode).toBe(404)
  })
})
