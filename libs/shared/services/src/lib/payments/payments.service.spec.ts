import {
  AlgorandTransactionStatus,
  CirclePaymentVerificationOptions,
  CollectibleListingStatus,
  PaymentItem,
  PaymentStatus,
  UserAccount,
  UserAccountStatus,
  WorkflowState,
} from '@algomart/schemas'
import {
  configureSignTxns,
  createGetTransactionParamsMock,
  encodeTransaction,
} from '@algomart/shared/algorand'
import {
  CollectibleListingsModel,
  PackModel,
  PaymentModel,
  UserAccountModel,
  UserAccountTransferModel,
} from '@algomart/shared/models'
import { PacksService, PaymentsService } from '@algomart/shared/services'
import {
  createCollectibleListing,
  createCreditCard,
  createCreditPurchase,
  createOwnedPackWithCollectibles,
  createPendingCreditPayment,
  createUserAccount,
  defaultVerifyBlockchainFailureMockData,
  exceptionCreatePaymentMock,
  generateSuccessfulGetApplicantMock,
  generateSuccessfulGetWorkflowDetailsMock,
  nullResponseCreatePaymentMock,
  setupChainalysisAdapterMockImplementations,
  setupCircleAdapterMockImplementations,
  setupOnfidoAdapterMockImplementations,
  setupTestDatabase,
  teardownTestDatabase,
} from '@algomart/shared/tests'
import { addDays, DependencyResolver, UserError } from '@algomart/shared/utils'
import algosdk from 'algosdk'
import { UnrecoverableError } from 'bullmq'
import { Knex } from 'knex'
import { Model, Transaction } from 'objection'
import { v4 } from 'uuid'

import { closeQueues, configureTestResolver } from '../test/mock-resolver'

let knex: Knex
let resolver: DependencyResolver
let paymentsService: PaymentsService
const testingDatabaseName = 'payments_service_submit_payment_to_circle_test_db'

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
  paymentsService = resolver.get<PaymentsService>(PaymentsService.name)
})

afterEach(async () => {
  await closeQueues(resolver)
  resolver.clear()
  await teardownTestDatabase(testingDatabaseName, knex)
})

describe('PaymentsService', () => {
  describe('submitPaymentToCircle', () => {
    describe('Valid payment Id', () => {
      let userAccount
      let payment

      beforeEach(async () => {
        ;({ userAccount } = await createUserAccount(knex, baseUserAccount))
        ;({ payment } = await createPendingCreditPayment(knex, {
          userId: userAccount.id,
          amount: '100',
        }))
      })

      test('Happy path', async () => {
        setupCircleAdapterMockImplementations()

        await paymentsService.submitPaymentToCircle({
          paymentId: payment.id,
        })

        // Assert
        const updatedPayment = await PaymentModel.query().findById(payment.id)
        expect(updatedPayment.status).toBe(PaymentStatus.Pending)
        expect(updatedPayment.error).toBe(null)
        expect(updatedPayment.errorDetails).toBe(null)
        expect(updatedPayment.externalId).toBeTruthy()
      })

      test('Null response from circle Adapter', async () => {
        // arrange

        // sets up a default success mock for createPayment
        setupCircleAdapterMockImplementations({
          createPayment: nullResponseCreatePaymentMock,
        })

        let caughtError = null
        try {
          await paymentsService.submitPaymentToCircle({
            paymentId: payment.id,
          })
        } catch (error) {
          caughtError = error
        }
        expect(caughtError).toBeTruthy()
        expect(caughtError instanceof UnrecoverableError).toBe(false)

        // Assert
        const updatedPayment = await PaymentModel.query().findById(payment.id)

        // We expect an error to be thrown, but we consider it recoverable, so the status should still be pending
        expect(updatedPayment.status).toBe(PaymentStatus.Pending)
        expect(updatedPayment.error).toBe(null)
        expect(updatedPayment.errorDetails).toBe(null)
        expect(updatedPayment.externalId).toBe(null)
      })

      test('Exception while calling circle adapter', async () => {
        // arrange

        // sets up a default success mock for createPayment
        setupCircleAdapterMockImplementations({
          createPayment: exceptionCreatePaymentMock,
        })

        let caughtError = null
        try {
          await paymentsService.submitPaymentToCircle({
            paymentId: payment.id,
          })
        } catch (error) {
          caughtError = error
        }
        expect(caughtError).toBeTruthy()
        expect(caughtError).toBe(exceptionCreatePaymentMock.error)
        expect(caughtError instanceof UnrecoverableError).toBe(false)

        // Assert
        const updatedPayment = await PaymentModel.query().findById(payment.id)

        // We expect an error to be thrown, but we consider it recoverable, so the status should still be pending
        expect(updatedPayment.status).toBe(PaymentStatus.Pending)
        expect(updatedPayment.error).toBe(null)
        expect(updatedPayment.errorDetails).toBe(null)
        expect(updatedPayment.externalId).toBe(null)
      })
    })

    test('Invalid payment Id', async () => {
      // arrange

      // sets up a default success mock for createPayment
      setupCircleAdapterMockImplementations({
        createPayment: exceptionCreatePaymentMock,
      })

      let caughtError = null
      try {
        await paymentsService.submitPaymentToCircle({
          paymentId: v4(),
        })
      } catch (error) {
        caughtError = error
      }
      expect(caughtError).toBeTruthy()
      expect(caughtError.message.includes('Payment not found')).toBe(true)
      expect(caughtError instanceof UnrecoverableError).toBe(true)
    })

    test('Payment with no payment card (should mark payment failed)', async () => {
      // arrange

      // sets up a default success mock for createPayment
      setupCircleAdapterMockImplementations({
        createPayment: exceptionCreatePaymentMock,
      })

      const { userAccount } = await createUserAccount(knex, {
        ...baseUserAccount,
        verificationStatus: UserAccountStatus.Approved,
      })

      const { payment } = await createPendingCreditPayment(knex, {
        userId: userAccount.id,
        amount: '100',
        createPaymentCard: false,
      })

      let caughtError = null
      try {
        await paymentsService.submitPaymentToCircle({
          paymentId: payment.id,
        })
      } catch (error) {
        caughtError = error
      }

      // Assert
      expect(caughtError).toBeTruthy()
      expect(caughtError.message.includes('has no payment card')).toBe(true)
      expect(caughtError instanceof UnrecoverableError).toBe(true)

      const updatedPayment = await PaymentModel.query().findById(payment.id)

      // The thrown error should be unrecoverable but we'd still expect the payment status to be pending
      expect(updatedPayment.status).toBe(PaymentStatus.Pending)
      expect(updatedPayment.error).toBe(null)
      expect(updatedPayment.errorDetails).toBe(null)
      expect(updatedPayment.externalId).toBe(null)
    })

    describe('handle blockchain address verification', () => {
      let algod: algosdk.Algodv2
      let paymentData
      let encodedSignedTransaction

      beforeEach(async () => {
        algod = new algosdk.Algodv2(
          '',
          'https://node.testnet.algoexplorerapi.io/v2',
          ''
        )

        resolver = configureTestResolver({
          isKYCEnabled: true,
        })

        setupOnfidoAdapterMockImplementations()
        const { userAccount } = await createUserAccount(knex, baseUserAccount)

        algod.getTransactionParams = createGetTransactionParamsMock()
        const account = algosdk.generateAccount()
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          amount: 0,
          from: account.addr,
          suggestedParams: await algod.getTransactionParams().do(),
          to: account.addr,
        })
        const txns = [await encodeTransaction(txn)]

        // Act
        const signTxns = await configureSignTxns([account])
        const signedTxns = await signTxns(txns)

        encodedSignedTransaction = signedTxns[0]

        paymentData = {
          userExternalId: userAccount.externalId,
          encodedSignedTransaction: signedTxns[0],
        }
      })

      test('payment should not be created if a blockchain address is not able to be checked for verification', async () => {
        setupChainalysisAdapterMockImplementations({
          verifyBlockchainAddress: () => [
            defaultVerifyBlockchainFailureMockData,
          ],
        })
        await expect(async () => {
          await paymentsService.createUsdcPayment(paymentData, {
            encodedSignedTransaction,
          })
        }).rejects.toThrow('blockchain address is sanctioned')
      })

      test('payment should not be created if a blockchain address can not be verified', async () => {
        setupChainalysisAdapterMockImplementations({
          verifyBlockchainAddress: () => null,
        })
        await expect(async () => {
          await paymentsService.createUsdcPayment(paymentData, {
            encodedSignedTransaction,
          })
        }).rejects.toThrow('address could not be checked for verification')
      })
    })

    test('payment should fail if user has not successfully completed kyc - KYC ENABLED', async () => {
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
      setupChainalysisAdapterMockImplementations()
      const { userAccount } = await createUserAccount(knex, baseUserAccount)
      const cardId = v4()

      await createCreditPurchase(knex, {
        amount: '1000000',
        userId: userAccount.id,
        paymentStatus: PaymentStatus.Paid,
        settled: true,
      }) // balance = 1000100, available = 1000100

      const user = await UserAccountModel.query().findById(userAccount.id)
      expect(user.balance).toBe('1000100')

      let caughtError = null
      try {
        await createCreditCard(knex, {
          cardId,
          userId: userAccount.id,
        })
        await paymentsService.createCcPayment(userAccount, {
          amount: '600',
          description: 'Test',
          verification: CirclePaymentVerificationOptions.none,
          metadata: { email: baseUserAccount.email },
          cardId,
        }) // balance = 1000700, available = 1000700
      } catch (error) {
        caughtError = error
      }

      // Assert
      expect(caughtError).toBeTruthy()
      expect(
        caughtError.message.includes(
          'Purchase restricted and workflow for applicant not found'
        )
      ).toBe(true)
      expect(caughtError instanceof UserError).toBe(true)
    })
  })

  describe('handleUnifiedPaymentHandoff', () => {
    let testTransfer: UserAccountTransferModel

    beforeEach(() => {
      paymentsService.purchasePackWithCredits = jest.fn()
      paymentsService.purchaseListingWithCredits = jest.fn()

      testTransfer = {
        userAccountId: 'testUserAccountId',
        entityId: 'testEntityId',
      } as UserAccountTransferModel
    })

    test('should grab payment by id', async () => {
      jest.spyOn(paymentsService, 'getPaymentById').mockResolvedValue({
        itemType: PaymentItem.Pack,
        itemId: 'test-item-id',
      } as PaymentModel)

      await paymentsService.handleUnifiedPaymentHandoff(testTransfer)

      expect(paymentsService.getPaymentById).toHaveBeenCalledWith(
        'testUserAccountId',
        'testEntityId'
      )
    })

    test('should throw error if payment has no itemId', async () => {
      jest
        .spyOn(paymentsService, 'getPaymentById')
        .mockResolvedValue({} as PaymentModel)

      await expect(
        async () =>
          await paymentsService.handleUnifiedPaymentHandoff(testTransfer)
      ).rejects.toThrowError()
    })

    test('should call purchase pack with credits if item type is pack', async () => {
      jest.spyOn(paymentsService, 'getPaymentById').mockResolvedValue({
        itemType: PaymentItem.Pack,
        itemId: 'test-item-id',
      } as PaymentModel)

      await paymentsService.handleUnifiedPaymentHandoff(testTransfer)

      expect(paymentsService.purchasePackWithCredits).toHaveBeenCalledWith({
        packId: 'test-item-id',
      })
      expect(paymentsService.purchaseListingWithCredits).not.toHaveBeenCalled()
    })

    test('should call purchase listing with credits if item type is collectible', async () => {
      jest.spyOn(paymentsService, 'getPaymentById').mockResolvedValue({
        itemType: PaymentItem.Collectible,
        itemId: 'test-item-id',
      } as PaymentModel)

      await paymentsService.handleUnifiedPaymentHandoff(testTransfer)

      expect(paymentsService.purchaseListingWithCredits).toHaveBeenCalledWith(
        testTransfer.userAccountId,
        'test-item-id'
      )
      expect(paymentsService.purchasePackWithCredits).not.toHaveBeenCalled()
    })
  })

  describe('handleUnifiedPaymentItemReserve', () => {
    beforeEach(() => {
      paymentsService.reserveListing = jest.fn()
    })

    test('should throw error if no user provided', async () => {
      await expect(
        async () =>
          await paymentsService.handleUnifiedPaymentItemReserve(
            PaymentItem.Pack,
            'test-item-id',
            undefined,
            {} as Transaction
          )
      ).rejects.toThrowError()
    })

    test('should swap a pack template id for a reserved pack id', async () => {
      jest
        .spyOn(PacksService.prototype, 'reservePackByTemplateId')
        .mockResolvedValue({
          id: 'test-pack-id',
        } as PackModel)

      const id = await paymentsService.handleUnifiedPaymentItemReserve(
        PaymentItem.Pack,
        'test-pack-template-id',
        {} as UserAccount
      )

      expect(
        PacksService.prototype.reservePackByTemplateId
      ).toHaveBeenCalledWith('test-pack-template-id', {}, undefined, true)
      expect(id).toEqual('test-pack-id')
    })

    test('should reserve a collectible listing id', async () => {
      const listingId = 'test-listing-id'
      jest.spyOn(paymentsService, 'reserveListing').mockResolvedValue({
        id: listingId,
      } as CollectibleListingsModel)

      const id = await paymentsService.handleUnifiedPaymentItemReserve(
        PaymentItem.Collectible,
        listingId,
        {} as UserAccount
      )

      expect(paymentsService.reserveListing).toHaveBeenCalledWith(
        listingId,
        undefined,
        undefined
      )
      expect(id).toEqual(listingId)
    })

    test('should just passthrough id if no item type provided', async () => {
      const id = await paymentsService.handleUnifiedPaymentItemReserve(
        undefined,
        'test-id',
        {} as UserAccount
      )

      expect(id).toEqual(id)
    })
  })

  describe('handleUnifiedPaymentItemUnreserve', () => {
    const itemId = 'test-item-id'
    const userId = 'test-user-id'

    beforeEach(() => {
      PacksService.prototype.clearPackOwner = jest.fn()
      paymentsService.clearListingReservation = jest.fn()
    })

    test('should call clear pack owner', async () => {
      await paymentsService.handleUnifiedPaymentItemUnreserve(
        itemId,
        PaymentItem.Pack,
        userId
      )

      expect(PacksService.prototype.clearPackOwner).toHaveBeenCalledWith(
        itemId,
        userId,
        undefined
      )
      expect(paymentsService.clearListingReservation).not.toHaveBeenCalled()
    })

    test('should call clear listing reservation', async () => {
      await paymentsService.handleUnifiedPaymentItemUnreserve(
        itemId,
        PaymentItem.Collectible,
        userId
      )

      expect(paymentsService.clearListingReservation).toHaveBeenCalledWith(
        itemId,
        userId,
        undefined
      )
      expect(PacksService.prototype.clearPackOwner).not.toHaveBeenCalled()
    })
  })

  describe('listing reservations', () => {
    let sellerUserAccount
    let buyerUserAccount
    let collectibles
    let collectibleListing

    beforeEach(async () => {
      ;({ userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      }))
      ;({ userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      }))
      ;({ collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      }))
      ;({ collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        status: CollectibleListingStatus.Settled,
      }))
    })

    const reserveListing = async () => {
      await paymentsService.reserveListing(
        collectibleListing.id,
        buyerUserAccount.id
      )

      // Assert
      const updatedListing = await CollectibleListingsModel.query().findById(
        collectibleListing.id
      )

      expect(updatedListing.claimedAt).not.toBeNull()
      expect(updatedListing.buyerId).toEqual(buyerUserAccount.id)
      expect(updatedListing.status).toEqual(CollectibleListingStatus.Reserved)
    }

    describe('reserveListing', () => {
      test('should reserve listing', async () => {
        await reserveListing()
      })
    })

    describe('clear listing reservation', () => {
      test('should clear listing reservation', async () => {
        await reserveListing()

        await paymentsService.clearListingReservation(
          collectibleListing.id,
          buyerUserAccount.id
        )

        // Assert
        const updatedListing = await CollectibleListingsModel.query().findById(
          collectibleListing.id
        )

        expect(updatedListing.buyerId).toBeNull()
        expect(updatedListing.claimedAt).toBeNull()
        expect(updatedListing.status).toEqual(CollectibleListingStatus.Active)
        expect(updatedListing.purchasedAt).toBeNull()
      })
    })
  })
})
