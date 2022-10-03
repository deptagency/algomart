import {
  AlgorandTransactionStatus,
  CircleTransferStatus,
  CollectibleListingStatus,
  UserAccountStatus,
} from '@algomart/schemas'
import { decodeRawSignedTransaction } from '@algomart/shared/algorand'
import { CollectibleListingsModel } from '@algomart/shared/models'
import { SubmitCreditsTransferQueue } from '@algomart/shared/queues'
import { MarketplaceService } from '@algomart/shared/services'
import {
  createCollectibleListing,
  createOwnedPackWithCollectibles,
  createUserAccount,
  fakeAddressFor,
  setupAlgorandAdapterMockImplementations,
  setupTestDatabase,
  successfulGetAccountInfoMock,
  successfulGetAssetOwnerMock,
  teardownTestDatabase,
} from '@algomart/shared/tests'
import { addDays, DependencyResolver, UserError } from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { Knex } from 'knex'
import { Model } from 'objection'

import { closeQueues, configureTestResolver } from '../test/mock-resolver'

let knex: Knex
let resolver: DependencyResolver
let marketplaceService: MarketplaceService
const databaseName = 'marketplace_service_test'

beforeEach(async () => {
  jest.restoreAllMocks()
  knex = await setupTestDatabase(databaseName)
  Model.knex(knex)
  resolver = configureTestResolver()
  marketplaceService = resolver.get<MarketplaceService>(MarketplaceService.name)
})

afterEach(async () => {
  await closeQueues(resolver)
  resolver.clear()
  await teardownTestDatabase(databaseName, knex)
})

describe('MarketplaceService', () => {
  describe('createListing', () => {
    let userAccount
    let collectibles

    beforeEach(async () => {
      // Arrange
      ;({ userAccount } = await createUserAccount(knex, {
        email: 'test@email.com',
        externalId: 'test',
        username: 'test',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      }))
      ;({ collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: userAccount.id,
        transactionDate: addDays(new Date(), -10),
      }))

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })
    })

    test('should create a listing', async () => {
      // Act
      const listing = await marketplaceService.createListing(userAccount, {
        collectibleId: collectibles[0].id,
        price: 1000,
      })

      // Assert
      expect(marketplaceService).toBeInstanceOf(MarketplaceService)
      expect(listing).toBeDefined()
    })

    test('should fail to create a listing when an active one is present', async () => {
      // Arrange
      await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: userAccount.id,
      })

      // Act / Assert
      await expect(async () => {
        await marketplaceService.createListing(userAccount, {
          collectibleId: collectibles[0].id,
          price: 1000,
        })
      }).rejects.toThrow('Collectible not available to list for sale')
    })

    /**
      This is essentially the same test as 'should fail to create a listing when an active one is present'
      but testing the specific flow outlined in SI report as descibed below

      (Buy-List)
      1. As user 1, list an NFT for sale. Save the request so it can be submitted again later.
      2. As user 2, purchase the NFT.
      3. As user 1, immediately re-list the NFT for sale. This must be done by directly
      submitting an HTTP request, it cannot be done through the UI.
      4. Observe that the NFT is listed for sale by user 2. Check the account balances for
      users 1 and 2.
      5. As user 3, purchase the NFT.
      6. Observe that user 1, not user 2, gained money from the sale.

      The issue was that we previously only checked that there was no other listing
      in ACTIVE state, we are now checking that there is no other listing NOT in
      SETTLED or CANCELLED state to account for in progress sales.
     */
    test('should fail to create a listing when a non SETTLED or CANCELLED one is present', async () => {
      // Arrange
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        status: CollectibleListingStatus.Active,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await marketplaceService.purchaseListingWithCredits(
        buyerUserAccount.id,
        collectibleListing.id
      )
      await expect(async () => {
        await marketplaceService.createListing(sellerUserAccount, {
          collectibleId: collectibles[0].id,
          price: 1000,
        })
      }).rejects.toThrow('Collectible not available to list for sale')
    })

    test('should fail to create a listing when not the owner', async () => {
      const { userAccount: otherUserAccount } = await createUserAccount(knex, {
        email: 'other@email.com',
        externalId: 'other',
        username: 'other',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })

      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: otherUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })

      await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: userAccount.id,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await expect(async () => {
        await marketplaceService.createListing(userAccount, {
          collectibleId: collectibles[0].id,
          price: 1000,
        })
      }).rejects.toBeInstanceOf(UserError)
    })

    test('should fail to list when not yet tradeable', async () => {
      // Arrange
      const { userAccount: otherUserAccount } = await createUserAccount(knex, {
        email: 'other@email.com',
        externalId: 'other',
        username: 'other',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })

      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: otherUserAccount.id,
      })

      await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: userAccount.id,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await expect(async () => {
        await marketplaceService.createListing(userAccount, {
          collectibleId: collectibles[0].id,
          price: 1000,
        })
      }).rejects.toBeInstanceOf(UserError)
    })
  })

  describe('purchaseListingWithCredits', () => {
    test('should queue up transfers', async () => {
      // Arrange
      const queue = resolver.get<SubmitCreditsTransferQueue>(
        SubmitCreditsTransferQueue.name
      )
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      const before = await queue.getCount()

      // Act
      const buyerTransfer = await marketplaceService.purchaseListingWithCredits(
        buyerUserAccount.id,
        collectibleListing.id
      )

      // Assert
      expect(buyerTransfer).toBeDefined()
      expect(buyerTransfer.status).toBe(CircleTransferStatus.Pending)
      expect(await queue.getCount()).toBeGreaterThan(before)
    })

    test('should not purchase with insufficient balance', async () => {
      // Arrange
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 0,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        status: CollectibleListingStatus.Settled,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await expect(async () => {
        await marketplaceService.purchaseListingWithCredits(
          buyerUserAccount.id,
          collectibleListing.id
        )
      }).rejects.toBeInstanceOf(Error)
    })

    test('should not purchase your own listing', async () => {
      // Arrange
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        status: CollectibleListingStatus.Settled,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await expect(async () => {
        await marketplaceService.purchaseListingWithCredits(
          sellerUserAccount.id,
          collectibleListing.id
        )
      }).rejects.toBeInstanceOf(Error)
    })

    test('should not purchase inactive listing', async () => {
      // Arrange
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 0,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        status: CollectibleListingStatus.Settled,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await expect(async () => {
        await marketplaceService.purchaseListingWithCredits(
          buyerUserAccount.id,
          collectibleListing.id
        )
      }).rejects.toBeInstanceOf(Error)
    })

    /*
      This test is for verifying a fix for a condition brought up in SI report as described below

      (Buy-Buy)
      1. As user 1, list an NFT for sale.
      2. In two separate tabs, open the NFT with users 2 and 3.
      3. Quickly buy the NFT with both users.
      4. Observe that one user appears to be successful and loses money, but does not
      acquire the NFT.

      The issue was that trying to purchase the the sold listing caused the
      listing state to be set back to ACTIVE in the catch block.
    */
    test('should not re-set listing status when trying to purchase a listing in process of being sold or inactive', async () => {
      // Arrange
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyer2UserAccount } = await createUserAccount(knex, {
        email: 'buyer2@email.com',
        externalId: 'buyer2',
        username: 'buyer2',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        status: CollectibleListingStatus.Active,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await marketplaceService.purchaseListingWithCredits(
        buyerUserAccount.id,
        collectibleListing.id
      )
      await expect(async () => {
        await marketplaceService.purchaseListingWithCredits(
          buyer2UserAccount.id,
          collectibleListing.id
        )
      }).rejects.toThrow('Listing no longer available')

      const afterFailedpurchaseListingWithCredits =
        await CollectibleListingsModel.query().findById(collectibleListing.id)
      expect(afterFailedpurchaseListingWithCredits.status).not.toBe(
        CollectibleListingStatus.Active
      )
    })
    /**
      This test is for verifying a fix for a condition brought up in SI report as described below. The
      fix is the same as the one above, but explicitly testing the flow described in the report.

      (Delist-Buy)
      1. As user 1, list an NFT for sale.
      2. As user 2, prepare to purchase the NFT.
      3. As user 1, delist the NFT.
      4. As user 2, immediately attempt to purchase the NFT.
      5. Observe that the request fails, but the NFT also remains listed.

      The issue was that trying to purchase the the de-listed listing caused the
      listing state to be set back to ACTIVE in the catch block.
    */
    test('should not re-set listing status when trying to purchase a de-listed listing', async () => {
      // Arrange
      const { userAccount: sellerUserAccount } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        status: CollectibleListingStatus.Active,
      })

      setupAlgorandAdapterMockImplementations({
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
      })

      // Act / Assert
      await marketplaceService.delistCollectible(sellerUserAccount.id, {
        listingId: collectibleListing.id,
      })
      await expect(async () => {
        await marketplaceService.purchaseListingWithCredits(
          buyerUserAccount.id,
          collectibleListing.id
        )
      }).rejects.toThrow('Listing no longer available')

      const afterFailedpurchaseListingWithCredits =
        await CollectibleListingsModel.query().findById(collectibleListing.id)
      expect(afterFailedpurchaseListingWithCredits.status).toBe(
        CollectibleListingStatus.Canceled
      )
    })
  })

  describe('tradeListing', () => {
    test('should trade a sold NFT', async () => {
      // Arrange
      const {
        userAccount: sellerUserAccount,
        algorandAccount: sellerAlgorandAccount,
      } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        buyerId: buyerUserAccount.id,
        status: CollectibleListingStatus.TransferringCredits,
      })

      setupAlgorandAdapterMockImplementations({
        getAssetOwner: successfulGetAssetOwnerMock(
          sellerAlgorandAccount.address
        ),
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
        generateTradeTransactions: () => {
          const transactionId = fakeAddressFor('transaction')
          return {
            signedTransactions: [decodeRawSignedTransaction(transactionId)],
            transactionIds: [transactionId],
          }
        },
      })

      // Act
      const listing = await marketplaceService.tradeListing(
        collectibleListing.id
      )

      // Assert
      expect(listing).toBeDefined()
      expect(listing.status).toBe(CollectibleListingStatus.Settled)
    })

    test('should fail trade if invalid status', async () => {
      // Arrange
      const {
        userAccount: sellerUserAccount,
        algorandAccount: sellerAlgorandAccount,
      } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        buyerId: buyerUserAccount.id,
        status: CollectibleListingStatus.TransferringNFT,
      })

      setupAlgorandAdapterMockImplementations({
        getAssetOwner: successfulGetAssetOwnerMock(
          sellerAlgorandAccount.address
        ),
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
        generateTradeTransactions: () => {
          const transactionId = fakeAddressFor('transaction')
          return {
            signedTransactions: [decodeRawSignedTransaction(transactionId)],
            transactionIds: [transactionId],
          }
        },
      })

      // Act / Assert
      await expect(async () => {
        await marketplaceService.tradeListing(collectibleListing.id)
      }).rejects.toBeInstanceOf(UnrecoverableError)
    })

    test('should noop trade if already settled', async () => {
      // Arrange
      const {
        userAccount: sellerUserAccount,
        algorandAccount: sellerAlgorandAccount,
      } = await createUserAccount(knex, {
        email: 'seller@email.com',
        externalId: 'seller',
        username: 'seller',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { userAccount: buyerUserAccount } = await createUserAccount(knex, {
        email: 'buyer@email.com',
        externalId: 'buyer',
        username: 'buyer',
        status: AlgorandTransactionStatus.Confirmed,
        balance: 1000,
        verificationStatus: UserAccountStatus.Unverified,
      })
      const { collectibles } = await createOwnedPackWithCollectibles(knex, {
        collectiblesCount: 1,
        ownerId: sellerUserAccount.id,
        transactionDate: addDays(new Date(), -10),
      })
      const { collectibleListing } = await createCollectibleListing(knex, {
        collectibleId: collectibles[0].id,
        price: 1000,
        sellerId: sellerUserAccount.id,
        buyerId: buyerUserAccount.id,
        status: CollectibleListingStatus.Settled,
      })

      setupAlgorandAdapterMockImplementations({
        getAssetOwner: successfulGetAssetOwnerMock(
          sellerAlgorandAccount.address
        ),
        getAccountInfo: successfulGetAccountInfoMock(
          collectibles.map((c) => c.address)
        ),
        generateTradeTransactions: () => {
          const transactionId = fakeAddressFor('transaction')
          return {
            signedTransactions: [decodeRawSignedTransaction(transactionId)],
            transactionIds: [transactionId],
          }
        },
      })

      // Act / Assert
      const listing = await marketplaceService.tradeListing(
        collectibleListing.id
      )
      expect(listing).toBe(null)
    })
  })
})
