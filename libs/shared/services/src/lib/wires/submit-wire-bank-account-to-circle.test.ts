import {
  AlgorandTransactionStatus,
  UserAccount,
  UserAccountStatus,
} from '@algomart/schemas'
import { WireBankAccountModel } from '@algomart/shared/models'
import { WiresService } from '@algomart/shared/services'
import {
  badRequestCreateWireBankAccountMock,
  createUserAccount,
  createWireBankAccount,
  defaultSuccessfulCreateWireBankAccountResultProps,
  setupCircleAdapterMockImplementations,
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
const testingDatabaseName = 'wires_service_submit_to_circle_test_db'

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

describe('WiresService.submitWireBankAccountToCircle', () => {
  test('happy path: IBAN', async () => {
    // Arrange
    setupCircleAdapterMockImplementations()
    const wireBankAccountBefore = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      accountNumber: null,
      routingNumber: null,
      externalId: null,
      description: null,
      fingerprint: null,
      trackingRef: null,
      iban: 'DE31100400480532013000',
      default: true,
      isSaved: true,
    })

    // Act
    await wiresService.submitWireBankAccountToCircle({
      wireBankAccountId: wireBankAccountBefore.id,
    })

    // Assert
    const wireBankAccountAfter = await WireBankAccountModel.query().findById(
      wireBankAccountBefore.id
    )
    expect(wireBankAccountAfter).toBeTruthy()
    const propsExpectedNotToChange = [
      'iban',
      'default',
      'isSaved',
      'billingDetails',
      'bankAddress',
      'ownerId',
    ]
    for (const property of propsExpectedNotToChange) {
      expect(wireBankAccountAfter[property]).toEqual(
        wireBankAccountBefore[property]
      )
    }
    expect(wireBankAccountAfter.externalId).toBe(
      defaultSuccessfulCreateWireBankAccountResultProps.id
    )
    const propsExpectedToChange = [
      'description',
      'fingerprint',
      'trackingRef',
      'status',
    ]
    for (const property of propsExpectedToChange) {
      expect(wireBankAccountAfter[property]).toEqual(
        defaultSuccessfulCreateWireBankAccountResultProps[property]
      )
    }
  })

  // We expect circle to throw an error if e.g. account or address info is invalid
  // Our function should throw an Unrecoverable error and it should delete the row
  test('Error response from Circle', async () => {
    // Arrange
    setupCircleAdapterMockImplementations({
      createWireBankAccount: badRequestCreateWireBankAccountMock,
    })
    const wireBankAccountBefore = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      accountNumber: null,
      routingNumber: null,
      externalId: null,
      description: null,
      fingerprint: null,
      trackingRef: null,
      iban: 'DE31100400480532013000',
      default: true,
      isSaved: true,
    })

    // Act
    let caughtError = null
    try {
      await wiresService.submitWireBankAccountToCircle({
        wireBankAccountId: wireBankAccountBefore.id,
      })
    } catch (error) {
      caughtError = error
    }

    // Assert
    expect(caughtError).toBeTruthy()
    expect(caughtError instanceof UnrecoverableError).toBe(true)

    const wireBankAccountAfter = await WireBankAccountModel.query().findById(
      wireBankAccountBefore.id
    )
    expect(wireBankAccountAfter).toBeFalsy()
  })

  // If the circle adapter throws an error (meaning something unexpected happened)
  // the function should just throw that error so a retry can occur
  // the row should be left as is
  test('Can not communicate with Circle', async () => {
    // Arrange
    const circleError = new Error('UNEXPECTED ERROR')
    setupCircleAdapterMockImplementations({
      createWireBankAccount: async () => {
        throw circleError
      },
    })
    const wireBankAccountBefore = await createWireBankAccount(knex, {
      ownerId: userAccount.id,
      accountNumber: null,
      routingNumber: null,
      externalId: null,
      description: null,
      fingerprint: null,
      trackingRef: null,
      iban: 'DE31100400480532013000',
      default: true,
      isSaved: true,
    })

    // Act
    let caughtError = null
    try {
      await wiresService.submitWireBankAccountToCircle({
        wireBankAccountId: wireBankAccountBefore.id,
      })
    } catch (error) {
      caughtError = error
    }

    // Assert
    expect(caughtError).toBeTruthy()
    expect(caughtError instanceof UnrecoverableError).toBe(false)
    expect(caughtError).toBe(circleError)

    const wireBankAccountAfter = await WireBankAccountModel.query().findById(
      wireBankAccountBefore.id
    )
    expect(wireBankAccountAfter).toEqual({
      ...wireBankAccountBefore,
      createdAt: new Date(wireBankAccountBefore.createdAt),
      updatedAt: new Date(wireBankAccountBefore.updatedAt),
    })
  })
})
