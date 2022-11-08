import { AlgorandTransactionStatus } from '@algomart/schemas'
import { CollectibleModel, PackModel } from '@algomart/shared/models'
import { ClaimPackSteps } from '@algomart/shared/queues'
import { ClaimPackService } from '@algomart/shared/services'
import {
  alreadyInLedgerErrorSubmitTransactionMock,
  fakeAddressFor,
  generateSuccessfulCreateAssetTransactionsMock,
  genericUnsuccessfulSubmitTransactionMock,
  setupAlgorandAdapterMockImplementations,
  setupTestDatabase,
  teardownTestDatabase,
  transactionDeadErrorSubmitTransactionsMock,
} from '@algomart/shared/tests'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'

import { closeQueues, configureTestResolver } from '../../test/mock-resolver'

import {
  addCreationTransactionsToPackCollectibles,
  expectAllTransactionGroupsCountToBe,
  expectTransactionAddressesNotToExist,
  expectTransactionsToBeConfirmed,
  expectTransactionsToBeFailed,
  setupUserAccountAndClaimedPack,
} from './common'

let knex: Knex
let resolver: DependencyResolver
let claimPackService: ClaimPackService
const testingDatabaseName = 'claim_pack_service_mint_pack_collectibles_test_db'
const step = ClaimPackSteps.mintPackCollectibles

beforeEach(async () => {
  jest.restoreAllMocks()
  knex = await setupTestDatabase(testingDatabaseName)
  Model.knex(knex)

  resolver = configureTestResolver()
  claimPackService = resolver.get<ClaimPackService>(ClaimPackService.name)
})

afterEach(async () => {
  await closeQueues(resolver)
  resolver.clear()
  await teardownTestDatabase(testingDatabaseName, knex)
})

/**
 * TODO:
 * These tests don't adequately test for race conditions, but do test for retrying operations in failed states and
 * no-oping already completed operations.
 *
 * I'd love to test for race conditions. The options as I see it are:
 *   1.) Modify the code being tested. Add conditions to check if it's in test mode to execute branches in our tests.
 *
 *   2.) write stress tests which make lots of simultaneous requests for some period of time to ensure nothing unexpected
 *       happens.
 *
 * both have benefits/ drawbacks.
 */

describe('ClaimPackService.mintPackCollectibles', () => {
  describe('Minting has not started yet', () => {
    test('Happy path', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        generateCreateAssetTransactions:
          generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
      })
      const { pack } = await setupUserAccountAndClaimedPack({
        knex: knex,
        status: AlgorandTransactionStatus.Confirmed,
        collectiblesCount: mockTransactionIds.length,
      })

      await claimPackService.mintPackCollectibles({ packId: pack.id, step })

      // Assert
      const updatedPack = await getPackAndCollectibles(pack.id)
      const updatedCollectibles = updatedPack.collectibles
      const updatedCollectibleCreationTransactions =
        updatedPack.collectibles.map(
          (collectible) => collectible.creationTransaction
        )

      // all collectibles should have confirmed creation transactions now
      expect(updatedCollectibles.length).toBe(mockTransactionIds.length)
      expectTransactionsToBeConfirmed(updatedCollectibleCreationTransactions)

      // all collectibles should have addresses now
      expectCollectiblesToHaveAddresses(updatedCollectibles)
    })

    test('Unable to submit collectible creation transactions after signing', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        generateCreateAssetTransactions:
          generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
        submitTransaction: genericUnsuccessfulSubmitTransactionMock,
      })

      const { pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: AlgorandTransactionStatus.Confirmed,
        collectiblesCount: mockTransactionIds.length,
      })

      // Act
      let caughtError = null
      try {
        await claimPackService.mintPackCollectibles({
          packId: pack.id,
          step,
        })
      } catch (error) {
        caughtError = error
      }

      // Assert
      expect(caughtError).toBeTruthy()
      expect(caughtError).toBe(genericUnsuccessfulSubmitTransactionMock.error)

      const updatedPack = await getPackAndCollectibles(pack.id)
      const updatedCollectibles = updatedPack.collectibles
      const updatedCollectibleCreationTransactions =
        updatedPack.collectibles.map(
          (collectible) => collectible.creationTransaction
        )

      // all collectibles should have failed creation transactions now
      expect(updatedCollectibles.length).toBe(mockTransactionIds.length)
      expectTransactionsToBeFailed(updatedCollectibleCreationTransactions)

      // no collectibles should have addresses
      expectCollectiblesNotToHaveAddresses(updatedCollectibles)
    })
  })

  describe('Funding started by another process but failed', () => {
    // eslint-disable-next-line jest/expect-expect
    test('Successful retry when transactions are recorded in FAILED state', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        generateCreateAssetTransactions:
          generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
      })
      const { pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: AlgorandTransactionStatus.Confirmed,
        collectiblesCount: mockTransactionIds.length,
      })

      await addCreationTransactionsToPackCollectibles(knex, {
        packId: pack.id,
        status: AlgorandTransactionStatus.Failed,
      })

      await claimPackService.mintPackCollectibles({ packId: pack.id, step })

      // Assert
      const updatedPack = await getPackAndCollectibles(pack.id)
      const updatedCollectibles = updatedPack.collectibles
      const updatedCollectibleCreationTransactions =
        updatedPack.collectibles.map(
          (collectible) => collectible.creationTransaction
        )

      // new transactions should not have been created
      await expectTransactionAddressesNotToExist(mockTransactionIds)

      // all collectibles should have confirmed creation transactions now
      expect(updatedCollectibles.length).toBe(mockTransactionIds.length)
      expectTransactionsToBeConfirmed(updatedCollectibleCreationTransactions)

      // all collectibles should have addresses now
      expectCollectiblesToHaveAddresses(updatedCollectibles)
    })

    test('Successful retry when transactions are recorded in SIGNED state', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        generateCreateAssetTransactions:
          generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
      })
      const { pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: AlgorandTransactionStatus.Confirmed,
        collectiblesCount: mockTransactionIds.length,
      })

      await addCreationTransactionsToPackCollectibles(knex, {
        packId: pack.id,
        status: AlgorandTransactionStatus.Signed,
      })

      await claimPackService.mintPackCollectibles({ packId: pack.id, step })

      // Assert
      const updatedPack = await getPackAndCollectibles(pack.id)
      const updatedCollectibles = updatedPack.collectibles
      const updatedCollectibleCreationTransactions =
        updatedPack.collectibles.map(
          (collectible) => collectible.creationTransaction
        )

      // new transactions should not have been created
      await expectTransactionAddressesNotToExist(mockTransactionIds)

      // all collectibles should have confirmed creation transactions now
      expect(updatedCollectibles.length).toBe(mockTransactionIds.length)
      expectTransactionsToBeConfirmed(updatedCollectibleCreationTransactions)

      // all collectibles should have addresses now
      expectCollectiblesToHaveAddresses(updatedCollectibles)
    })

    test('Successful retry when transactions are recorded in NON-CONFIRMED state, but are actually already in the ledger', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        generateCreateAssetTransactions:
          generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
        submitTransaction: alreadyInLedgerErrorSubmitTransactionMock,
      })
      const { pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: AlgorandTransactionStatus.Confirmed,
        collectiblesCount: mockTransactionIds.length,
      })

      await addCreationTransactionsToPackCollectibles(knex, {
        packId: pack.id,
        status: AlgorandTransactionStatus.Signed,
      })

      await claimPackService.mintPackCollectibles({ packId: pack.id, step })

      // Assert
      const updatedPack = await getPackAndCollectibles(pack.id)
      const updatedCollectibles = updatedPack.collectibles
      const updatedCollectibleCreationTransactions =
        updatedPack.collectibles.map(
          (collectible) => collectible.creationTransaction
        )

      // new transactions should not have been created
      await expectTransactionAddressesNotToExist(mockTransactionIds)

      // all collectibles should have confirmed creation transactions now
      expect(updatedCollectibles.length).toBe(mockTransactionIds.length)
      expectTransactionsToBeConfirmed(updatedCollectibleCreationTransactions)

      // all collectibles should have addresses now
      expectCollectiblesToHaveAddresses(updatedCollectibles)
    })

    test('Errors as expected/ clears transaction data when transactions are recorded in SIGNED state, but were never submitted and are too old now', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        generateCreateAssetTransactions:
          generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
        submitTransaction: transactionDeadErrorSubmitTransactionsMock,
      })

      const { pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: AlgorandTransactionStatus.Signed,
        collectiblesCount: mockTransactionIds.length,
      })

      // Act
      let caughtError = null
      try {
        await claimPackService.mintPackCollectibles({
          packId: pack.id,
          step,
        })
      } catch (error) {
        caughtError = error
      }

      // Assert
      expect(caughtError).toBeTruthy()
      expect(caughtError).toBe(transactionDeadErrorSubmitTransactionsMock.error)

      const updatedPack = await getPackAndCollectibles(pack.id)
      const updatedCollectibles = updatedPack.collectibles
      const updatedCollectibleCreationTransactions = updatedCollectibles.map(
        (collectible) => collectible.creationTransaction
      )
      // none of the pack collectibles should have creation transactions
      expect(
        updatedCollectibleCreationTransactions.every(
          (collectible) => !collectible
        )
      ).toBe(true)

      // only one transaction group should be in the system at this point
      // (the user account creation transaction group)
      await expectAllTransactionGroupsCountToBe(1)
    })

    test('Successful retry when transactions are recorded in CONFIRMED state but do not have addresses', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        generateCreateAssetTransactions:
          generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
      })
      const { pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: AlgorandTransactionStatus.Confirmed,
        collectiblesCount: mockTransactionIds.length,
      })

      await addCreationTransactionsToPackCollectibles(knex, {
        packId: pack.id,
        status: AlgorandTransactionStatus.Confirmed,
      })

      await claimPackService.mintPackCollectibles({ packId: pack.id, step })

      // Assert
      const updatedPack = await getPackAndCollectibles(pack.id)
      const updatedCollectibles = updatedPack.collectibles
      const updatedCollectibleCreationTransactions =
        updatedPack.collectibles.map(
          (collectible) => collectible.creationTransaction
        )

      // new transactions should not have been created
      await expectTransactionAddressesNotToExist(mockTransactionIds)

      // all collectibles should have confirmed creation transactions now
      expect(updatedCollectibles.length).toBe(mockTransactionIds.length)
      expectTransactionsToBeConfirmed(updatedCollectibleCreationTransactions)

      // all collectibles should have addresses now
      expectCollectiblesToHaveAddresses(updatedCollectibles)
    })
  })

  test('No-ops if all collectibles have addresses', async () => {
    const claimPackService = resolver.get<ClaimPackService>(
      ClaimPackService.name
    )
    // Arrange
    const mockTransactionIds = [
      fakeAddressFor('transaction'),
      fakeAddressFor('transaction'),
    ]

    setupAlgorandAdapterMockImplementations({
      generateCreateAssetTransactions:
        generateSuccessfulCreateAssetTransactionsMock(mockTransactionIds),
    })
    const { pack } = await setupUserAccountAndClaimedPack({
      knex,
      status: AlgorandTransactionStatus.Confirmed,
      collectiblesCount: mockTransactionIds.length,
    })

    await addCreationTransactionsToPackCollectibles(knex, {
      packId: pack.id,
      status: AlgorandTransactionStatus.Confirmed,
      addresses: [1, 2],
    })

    await claimPackService.mintPackCollectibles({ packId: pack.id, step })

    // Assert
    const updatedPack = await getPackAndCollectibles(pack.id)
    const updatedCollectibles = updatedPack.collectibles
    const updatedCollectibleCreationTransactions = updatedPack.collectibles.map(
      (collectible) => collectible.creationTransaction
    )

    // new transactions should not have been created
    await expectTransactionAddressesNotToExist(mockTransactionIds)

    // all collectibles should have confirmed creation transactions
    expect(updatedCollectibles.length).toBe(mockTransactionIds.length)
    expectTransactionsToBeConfirmed(updatedCollectibleCreationTransactions)

    // all collectibles should have addresses
    expectCollectiblesToHaveAddresses(updatedCollectibles)
  })
})

async function getPackAndCollectibles(packId: string) {
  return await PackModel.query()
    .findOne({ id: packId })
    .withGraphFetched('collectibles.creationTransaction')
}

function expectCollectiblesToHaveAddresses(collectibles: CollectibleModel[]) {
  expect(collectibles.every((collectible) => collectible.address)).toBe(true)
}

function expectCollectiblesNotToHaveAddresses(
  collectibles: CollectibleModel[]
) {
  expect(collectibles.some((collectible) => collectible.address)).toBe(false)
}
