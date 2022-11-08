import {
  AlgorandTransactionStatus,
  CircleTransferStatus,
  PaymentStatus,
  UserAccountStatus,
} from '@algomart/schemas'
import {
  UserAccountModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import {
  closeQueues,
  configureTestResolver,
  UserAccountTransfersService,
} from '@algomart/shared/services'
import {
  createCreditPurchase,
  createUserAccount,
  defaultCreateUserWalletMockData,
  setupCircleAdapterMockImplementations,
  setupTestDatabase,
  teardownTestDatabase,
} from '@algomart/shared/tests'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'

let knex: Knex
let resolver: DependencyResolver
const testingDatabaseName = 'transfers_service_create_circle_transfer_test_db'

beforeEach(async () => {
  knex = await setupTestDatabase(testingDatabaseName)
  resolver = configureTestResolver()
  Model.knex(knex)
  jest.restoreAllMocks()
})

afterEach(async () => {
  await closeQueues(resolver)
  resolver.clear()
  await teardownTestDatabase(testingDatabaseName, knex)
})

describe('UserAccountTransfersService', () => {
  describe('createCircleTransferForUserAccountTransfer', () => {
    // eslint-disable-next-line jest/expect-expect
    test('Happy path, no pre-existing user wallet', async () => {
      // arrange
      const userAccountTransfersService =
        resolver.get<UserAccountTransfersService>(
          UserAccountTransfersService.name
        )

      setupCircleAdapterMockImplementations()

      const { userAccount } = await createUserAccount(knex, {
        email: 'test@test.local',
        externalId: 'test',
        username: 'test',
        balance: 100,
        status: AlgorandTransactionStatus.Confirmed,
        verificationStatus: UserAccountStatus.Approved,
      })

      const { transfer } = await createCreditPurchase(knex, {
        userId: userAccount.id,
        amount: '100',
        paymentStatus: PaymentStatus.Confirmed,
        settled: false,
        transferStatus: CircleTransferStatus.Pending,
      })

      // act
      await userAccountTransfersService.createCircleTransferForUserAccountTransfer(
        {
          userAccountTransferId: transfer.id,
        }
      )

      // assert

      // the user account should now have an external wallet Id
      const updatedUserAccount = await UserAccountModel.query().findById(
        userAccount.id
      )
      expect(updatedUserAccount.externalWalletId).toBe(
        defaultCreateUserWalletMockData.walletId
      )

      // the transfer should still be pending but should have a circleTransferPayload now
      const updatedTransfer = await UserAccountTransferModel.query().findById(
        transfer.id
      )
      expect(updatedTransfer.status).toBe(CircleTransferStatus.Pending)
      expect(updatedTransfer.error).toBe(null)
      expect(updatedTransfer.errorDetails).toBe(null)
      expect(updatedTransfer.circleTransferPayload).toBeTruthy()
      expect(updatedTransfer.creditsTransferJobCompletedAt).toBe(null)
    })
  })
})
