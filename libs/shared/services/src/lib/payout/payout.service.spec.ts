import {
  AlgorandTransactionStatus,
  CircleTransferStatus,
  CollectibleListingStatus,
  EntityType,
  PaymentStatus,
  UserAccountStatus,
  WorkflowState,
} from '@algomart/schemas'
import {
  PayoutModel,
  UserAccountModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import { SubmitCreditsTransferQueue } from '@algomart/shared/queues'
import {
  createCollectibleListing,
  createCreditPurchase,
  createOwnedPackWithCollectibles,
  createPackPurchaseTransfer,
  createPendingMarketplacePurchaseTransfer,
  createPendingPackPurchaseTransfer,
  createUserAccount,
  defaultVerifyBlockchainFailureMockData,
  fakeAddressFor,
  generateSuccessfulGetApplicantMock,
  generateSuccessfulGetWorkflowDetailsMock,
  setupChainalysisAdapterMockImplementations,
  setupOnfidoAdapterMockImplementations,
  setupTestDatabase,
  teardownTestDatabase,
} from '@algomart/shared/tests'
import { addDays, DependencyResolver, UserError } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'
import { v4 as uuid } from 'uuid'

import { closeQueues, configureTestResolver } from '../test/mock-resolver'

import { PayoutService } from './payout.service'

let knex: Knex
let resolver: DependencyResolver
let service: PayoutService
const databaseName = 'payout_service_test_db'
const baseUserAccount = {
  email: 'test@email.com',
  externalId: 'test-id',
  username: 'test-un',
  status: AlgorandTransactionStatus.Confirmed,
  balance: 0,
}

beforeEach(async () => {
  jest.restoreAllMocks()
  knex = await setupTestDatabase(databaseName)
  Model.knex(knex)
  setupChainalysisAdapterMockImplementations()
  resolver = configureTestResolver()
  service = resolver.get<PayoutService>(PayoutService.name)
})

afterEach(async () => {
  await closeQueues(resolver)
  resolver.clear()
  await teardownTestDatabase(databaseName, knex)
})

describe('PayoutService', () => {
  describe('getBalanceAvailableForPayout()', () => {
    test('should return 0 for new user', async () => {
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('0')
      expect(availableBalance.toString()).toBe('0')
    })

    test('should return the correct available balance for payout', async () => {
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })

      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Unverified,
      })

      await createCreditPurchase(knex, {
        amount: '2000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 2000, available = 2000

      // Create a marketplace purchase pending but no user account transfer yet
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })

      await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        buyerId: userAccount.id,
        status: CollectibleListingStatus.Reserved,
      }) // balance = 2000, available = 1000

      await createCreditPurchase(knex, {
        amount: '1000',
        userId: userAccount.id,
      }) // balance = 3000, available = 1000

      await createPackPurchaseTransfer(knex, {
        amount: '-500',
        userId: userAccount.id,
      }) // balance = 2500, available = 500

      await createCreditPurchase(knex, {
        amount: '20000',
        userId: userAccount.id,
      }) // balance = 22500, available = 500

      await createPackPurchaseTransfer(knex, {
        amount: '-231',
        userId: userAccount.id,
      }) // balance = 22269, available = 269

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('22269')
      expect(availableBalance.toString()).toBe('269')
    })

    test('should return 0 when available amount would be negative', async () => {
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Unverified,
      })

      await createCreditPurchase(knex, {
        amount: '1000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 1000, available = 1000

      await createCreditPurchase(knex, {
        amount: '1000',
        userId: userAccount.id,
      }) // balance = 2000, available = 1000

      await createPackPurchaseTransfer(knex, {
        amount: '-500',
        userId: userAccount.id,
      }) // balance = 1500, available = 500

      await createCreditPurchase(knex, {
        amount: '20000',
        userId: userAccount.id,
      }) // balance = 21500, available = 500

      await createPackPurchaseTransfer(knex, {
        amount: '-231',
        userId: userAccount.id,
      }) // balance = 21269, available = 269

      await createPackPurchaseTransfer(knex, {
        amount: '-1000',
        userId: userAccount.id,
      }) // balance = 20269, available = -731

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('20269')
      expect(availableBalance.toString()).toBe('0')
    })
  })

  describe('initiateUsdcPayout()', () => {
    test('should fail if requested amount is below min payout amount', async () => {
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Unverified,
      })
      await expect(async () => {
        await service.initiateUsdcPayout(userAccount, {
          amount: '1000',
          destinationAddress: fakeAddressFor('account'),
        })
      }).rejects.toBeInstanceOf(UserError)
    })

    test('should fail if requested amount more than available balance', async () => {
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Unverified,
      })

      await createCreditPurchase(knex, {
        amount: '10000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 10000, available = 10000

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('10000')
      expect(availableBalance.toString()).toBe('10000')
      await expect(async () => {
        await service.initiateUsdcPayout(userAccount, {
          amount: '10001',
          destinationAddress: fakeAddressFor('account'),
        })
      }).rejects.toBeInstanceOf(UserError)
    })

    test('should fail if requested amount more than available balance and consider pending transfers', async () => {
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Unverified,
      })

      await createCreditPurchase(knex, {
        amount: '10000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 10000, available = 10000

      await createCreditPurchase(knex, {
        amount: '10000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Confirmed,
        settled: false,
        transferStatus: CircleTransferStatus.Pending,
      }) // balance = 10000, available = 10000

      await createPendingPackPurchaseTransfer(knex, {
        amount: '-500',
        userId: userAccount.id,
      }) // balance = 10000, available = 9500

      await createPendingMarketplacePurchaseTransfer(knex, {
        amount: '-1750',
        userId: userAccount.id,
      }) // balance = 10000, available = 7750

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('10000')
      expect(availableBalance.toString()).toBe('7750')
      await expect(async () => {
        await service.initiateUsdcPayout(userAccount, {
          amount: '7751',
          destinationAddress: fakeAddressFor('account'),
        })
      }).rejects.toBeInstanceOf(UserError)
    })

    test('should create entities and queue the circle transfer for the payout', async () => {
      resolver = configureTestResolver({
        isKYCEnabled: true,
      })
      setupOnfidoAdapterMockImplementations()
      const queue = resolver.get<SubmitCreditsTransferQueue>(
        SubmitCreditsTransferQueue.name
      )
      const before = await queue.getCount()
      const nonCustodialAddress = fakeAddressFor('account')
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Approved,
      })

      await createCreditPurchase(knex, {
        amount: '10000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 10000, available = 10000

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('10000')
      expect(availableBalance.toString()).toBe('10000')
      await service.initiateUsdcPayout(userAccount, {
        amount: '600',
        destinationAddress: nonCustodialAddress,
      })
      const payout = await PayoutModel.query()
        .where({
          destinationAddress: nonCustodialAddress,
        })
        .first()
      expect(payout).toBeDefined()
      const transfer = await UserAccountTransferModel.query()
        .where({
          userAccountId: userAccount.id,
          amount: '-600',
        })
        .first()
      expect(transfer).toBeDefined()
      expect(await queue.getCount()).toBeGreaterThan(before)
    })

    describe('handle blockchain address verification', () => {
      let initialPaymentData
      let user

      beforeEach(async () => {
        resolver = configureTestResolver({
          isKYCEnabled: true,
        })
        setupOnfidoAdapterMockImplementations()

        const nonCustodialAddress = fakeAddressFor('account')
        const { userAccount } = await createUserAccount(knex, {
          ...baseUserAccount,
          verificationStatus: UserAccountStatus.Approved,
        })

        user = userAccount

        await createCreditPurchase(knex, {
          amount: '10000',
          userId: userAccount.id,
          paymentStatus: PaymentStatus.Paid,
          settled: true,
        })

        initialPaymentData = {
          userExternalId: userAccount.externalId,
          amount: '600',
          destinationAddress: nonCustodialAddress,
        }
      })

      test('should fail if user attempts to transfer to sanctioned blockchain address', async () => {
        setupChainalysisAdapterMockImplementations({
          verifyBlockchainAddress: () => [
            defaultVerifyBlockchainFailureMockData,
          ],
        })
        await expect(async () => {
          await service.initiateUsdcPayout(user, initialPaymentData)
        }).rejects.toThrow('blockchain address is sanctioned')
      })

      test('should fail if blockchain address is not able to be checked for verification', async () => {
        setupChainalysisAdapterMockImplementations({
          verifyBlockchainAddress: () => null,
        })
        await expect(async () => {
          await service.initiateUsdcPayout(user, initialPaymentData)
        }).rejects.toThrow('address could not be checked for verification')
      })
    })

    test('should fail if user has not successfully completed kyc - KYC ENABLED', async () => {
      resolver = configureTestResolver({
        isKYCEnabled: true,
      })
      const failedWorkflow = {
        externalId: 'fake-workflow-id',
        status: WorkflowState.fail,
        finished: true,
      }
      setupOnfidoAdapterMockImplementations({
        getApplicant: generateSuccessfulGetApplicantMock(failedWorkflow),
        getWorkflowDetails: generateSuccessfulGetWorkflowDetailsMock(
          WorkflowState.fail
        ),
      })
      const nonCustodialAddress = fakeAddressFor('account')
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Unverified,
      })

      await createCreditPurchase(knex, {
        amount: '10000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 10000, available = 10000

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('10000')
      expect(availableBalance.toString()).toBe('10000')
      await expect(async () => {
        await service.initiateUsdcPayout(userAccount, {
          amount: '600',
          destinationAddress: nonCustodialAddress,
        })
      }).rejects.toThrow('User must complete KYC process to withdraw funds')
    })

    test('should create entities and queue the circle transfer for the payout - KYC ENABLED', async () => {
      resolver = configureTestResolver({
        isKYCEnabled: true,
      })
      const queue = resolver.get<SubmitCreditsTransferQueue>(
        SubmitCreditsTransferQueue.name
      )
      const before = await queue.getCount()
      const nonCustodialAddress = fakeAddressFor('account')
      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Clear,
      })

      await createCreditPurchase(knex, {
        amount: '10000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 10000, available = 10000

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('10000')
      expect(availableBalance.toString()).toBe('10000')
      await service.initiateUsdcPayout(userAccount, {
        amount: '600',
        destinationAddress: nonCustodialAddress,
      })
      const payout = await PayoutModel.query()
        .where({
          destinationAddress: nonCustodialAddress,
        })
        .first()
      expect(payout).toBeDefined()
      const transfer = await UserAccountTransferModel.query()
        .where({
          userAccountId: userAccount.id,
          amount: '-600',
        })
        .first()
      expect(transfer).toBeDefined()
      expect(await queue.getCount()).toBeGreaterThan(before)
    })
  })

  describe('createUserAccountTransferForPayout()', () => {
    it('should fail if the user does not have enough available to cashout', async () => {
      const { userAccount } = await createUserAccount(knex, {
        email: 'test@email.com',
        externalId: 'test-id',
        username: 'test-un',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 0,
        verificationStatus: UserAccountStatus.Unverified,
      })

      await createCreditPurchase(knex, {
        amount: '10000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: false,
      }) // balance = 10000, available = 0

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('10000')
      expect(availableBalance.toString()).toBe('0')

      await expect(async () => {
        await service.createUserAccountTransferForPayout(userAccount.id, {
          amount: '-500',
          userAccountId: user.id,
          entityId: uuid(),
          entityType: EntityType.Payout,
          externalId: null,
        })
      }).rejects.toThrow(
        'Could not insert transfer, likely insufficient available balance'
      )
    })
    it('should insert a UserAccountTransfer and Event if the user has sufficient available balance', async () => {
      const { userAccount } = await createUserAccount(knex, {
        email: 'test@email.com',
        externalId: 'test-id',
        username: 'test-un',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 0,
        verificationStatus: UserAccountStatus.Unverified,
      })

      await createCreditPurchase(knex, {
        amount: '2000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 2000, available = 2000

      await createCreditPurchase(knex, {
        amount: '1000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: false,
      }) // balance = 3000, available = 2000

      await createPendingPackPurchaseTransfer(knex, {
        amount: '-1500',
        userId: userAccount.id,
      }) // balance = 3000, available = 500

      const { availableBalance } = await service.getBalanceAvailableForPayout(
        userAccount
      )
      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('3000')
      expect(availableBalance.toString()).toBe('500')
      const result = await service.createUserAccountTransferForPayout(
        userAccount.id,
        {
          amount: '-500',
          userAccountId: user.id,
          entityId: uuid(),
          entityType: EntityType.Payout,
          externalId: null,
        }
      )
      expect(result).toBeDefined()
    })
  })
})
