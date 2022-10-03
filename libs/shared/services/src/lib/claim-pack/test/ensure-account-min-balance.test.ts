import { AlgorandTransactionStatus } from '@algomart/schemas'
import { ClaimPackSteps } from '@algomart/shared/queues'
import { ClaimPackService } from '@algomart/shared/services'
import {
  alreadyInLedgerErrorSubmitTransactionMock,
  fakeAddressFor,
  generateSuccessfulInitialFundTransactionsMock,
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
  expectAllTransactionGroupsCountToBe,
  expectAllTransactionsCountToBe,
  expectTransactionAddressesToMatch,
  expectTransactionsToBeConfirmed,
  expectTransactionsToBeFailed,
  expectTransactionsToHaveError,
  getUserAccountAndTransactions,
  setupUserAccountAndClaimedPack,
} from './common'

let knex: Knex
let resolver: DependencyResolver
let claimPackService: ClaimPackService
const testingDatabaseName = 'claim_pack_service_ensure_min_balance_test_db'
const step = ClaimPackSteps.ensureAccountMinBalance

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

describe('ClaimPackService.ensureAccountMinBalance', () => {
  describe('Funding has not started yet', () => {
    // eslint-disable-next-line jest/expect-expect
    test('Happy path', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        initialFundTransactions:
          generateSuccessfulInitialFundTransactionsMock(mockTransactionIds),
      })
      const { userAccount, pack } = await setupUserAccountAndClaimedPack({
        knex: knex,
        status: null,
      })

      // Act
      await claimPackService.ensureAccountMinBalanceForPack({
        packId: pack.id,
        step,
      })

      // Assert
      const updatedUserAccount = await getUserAccountAndTransactions(
        userAccount.id
      )

      const transactions =
        updatedUserAccount.algorandAccount.creationTransaction.group
          .transactions

      // all transactions should exist in the same group and be referenced by user.algorandAccount.creationTransactionId
      expectTransactionAddressesToMatch(transactions, mockTransactionIds)

      // all transactions should be recorded as confirmed
      expectTransactionsToBeConfirmed(transactions)

      // the first transaction specifically should be user.algorandAccount.creationTransactionId
      expectAccountCreationTransactionAddressToMatch(
        updatedUserAccount,
        mockTransactionIds[0]
      )

      // at this point no other transactions or groups should exist
      await expectAllTransactionsCountToBe(mockTransactionIds.length)
      await expectAllTransactionGroupsCountToBe(1)
    })

    test('Unable to submit transactions after signing', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        initialFundTransactions:
          generateSuccessfulInitialFundTransactionsMock(mockTransactionIds),
        submitTransaction: genericUnsuccessfulSubmitTransactionMock,
      })

      const { userAccount, pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: null,
      })

      // Act
      let caughtError = null
      try {
        await claimPackService.ensureAccountMinBalanceForPack({
          packId: pack.id,
          step,
        })
      } catch (error) {
        caughtError = error
      }

      // Assert
      expect(caughtError).toBeTruthy()
      expect(caughtError).toBe(genericUnsuccessfulSubmitTransactionMock.error)

      const updatedUserAccount = await getUserAccountAndTransactions(
        userAccount.id
      )

      const transactions =
        updatedUserAccount.algorandAccount.creationTransaction.group
          .transactions

      // all transactions should exist in the same group and be referenced by user.algorandAccount.creationTransactionId
      expectTransactionAddressesToMatch(transactions, mockTransactionIds)

      // all transactions should be recorded as failed with the expected error
      expectTransactionsToBeFailed(transactions)
      expectTransactionsToHaveError(transactions, caughtError.message)

      // the first transaction specifically should be user.algorandAccount.creationTransactionId
      expectAccountCreationTransactionAddressToMatch(
        updatedUserAccount,
        mockTransactionIds[0]
      )

      // at this point no other transactions or groups should exist
      await expectAllTransactionsCountToBe(mockTransactionIds.length)
      await expectAllTransactionGroupsCountToBe(1)
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
          initialFundTransactions:
            generateSuccessfulInitialFundTransactionsMock(mockTransactionIds),
        })
        const { userAccount, pack } = await setupUserAccountAndClaimedPack({
          knex,
          status: AlgorandTransactionStatus.Failed,
        })

        // Act
        await claimPackService.ensureAccountMinBalanceForPack({
          packId: pack.id,
          step,
        })

        // Assert
        const updatedUserAccount = await getUserAccountAndTransactions(
          userAccount.id
        )

        const originalTransactions =
          userAccount.algorandAccount.creationTransaction.group.transactions
        const updatedTransactions =
          updatedUserAccount.algorandAccount.creationTransaction.group
            .transactions

        // the set of transactions associated with the account should not have changed
        expectTransactionAddressesToMatch(
          updatedTransactions,
          originalTransactions.map((trx) => trx.address)
        )

        // all transactions should be recorded as confirmed now
        expectTransactionsToBeConfirmed(updatedTransactions)

        // user.algorandAccount.creationTransactionId should not have changed
        expectAccountCreationTransactionAddressToMatch(
          updatedUserAccount,
          originalTransactions[0].address
        )

        // at this point no other transactions or groups should exist
        await expectAllTransactionsCountToBe(originalTransactions.length)
        await expectAllTransactionGroupsCountToBe(1)
      })

      // eslint-disable-next-line jest/expect-expect
      test('Successful retry when transactions are recorded in SIGNED state', async () => {
        // Arrange
        const mockTransactionIds = [
          fakeAddressFor('transaction'),
          fakeAddressFor('transaction'),
        ]
        setupAlgorandAdapterMockImplementations({
          initialFundTransactions:
            generateSuccessfulInitialFundTransactionsMock(mockTransactionIds),
        })
        const { userAccount, pack } = await setupUserAccountAndClaimedPack({
          knex,
          status: AlgorandTransactionStatus.Signed,
        })

        // Act
        await claimPackService.ensureAccountMinBalanceForPack({
          packId: pack.id,
          step,
        })

        // Assert
        const updatedUserAccount = await getUserAccountAndTransactions(
          userAccount.id
        )

        const originalTransactions =
          userAccount.algorandAccount.creationTransaction.group.transactions
        const updatedTransactions =
          updatedUserAccount.algorandAccount.creationTransaction.group
            .transactions

        // the set of transactions associated with the account should not have changed
        expectTransactionAddressesToMatch(
          updatedTransactions,
          originalTransactions.map((trx) => trx.address)
        )

        // all transactions should be recorded as confirmed now
        expectTransactionsToBeConfirmed(updatedTransactions)

        // user.algorandAccount.creationTransactionId should not have changed
        expectAccountCreationTransactionAddressToMatch(
          updatedUserAccount,
          originalTransactions[0].address
        )

        // at this point no other transactions or groups should exist
        await expectAllTransactionsCountToBe(originalTransactions.length)
        await expectAllTransactionGroupsCountToBe(1)
      })

      // eslint-disable-next-line jest/expect-expect
      test('Successful retry when transactions are recorded in NON-CONFIRMED state, but are actually already in the algorand ledger', async () => {
        // Arrange
        const mockTransactionIds = [
          fakeAddressFor('transaction'),
          fakeAddressFor('transaction'),
        ]
        setupAlgorandAdapterMockImplementations({
          initialFundTransactions:
            generateSuccessfulInitialFundTransactionsMock(mockTransactionIds),
          submitTransaction: alreadyInLedgerErrorSubmitTransactionMock,
        })
        const { userAccount, pack } = await setupUserAccountAndClaimedPack({
          knex,
          status: AlgorandTransactionStatus.Signed,
        })

        // Act
        await claimPackService.ensureAccountMinBalanceForPack({
          packId: pack.id,
          step,
        })

        // Assert
        const updatedUserAccount = await getUserAccountAndTransactions(
          userAccount.id
        )

        const originalTransactions =
          userAccount.algorandAccount.creationTransaction.group.transactions
        const updatedTransactions =
          updatedUserAccount.algorandAccount.creationTransaction.group
            .transactions

        // user.algorandAccount.creationTransactionId should not have changed
        expectTransactionAddressesToMatch(
          updatedTransactions,
          originalTransactions.map((trx) => trx.address)
        )

        // all transactions should be recorded as confirmed now
        expectTransactionsToBeConfirmed(updatedTransactions)

        // the first transaction specifically should be user.algorandAccount.creationTransactionId
        expectAccountCreationTransactionAddressToMatch(
          updatedUserAccount,
          originalTransactions[0].address
        )

        // at this point no other transactions or groups should exist
        await expectAllTransactionsCountToBe(originalTransactions.length)
        await expectAllTransactionGroupsCountToBe(1)
      })
    })

    test('Errors as expected/ clears transaction data when transactions are recorded in SIGNED state, but were never submitted and are too old now', async () => {
      // Arrange
      const mockTransactionIds = [
        fakeAddressFor('transaction'),
        fakeAddressFor('transaction'),
      ]
      setupAlgorandAdapterMockImplementations({
        initialFundTransactions:
          generateSuccessfulInitialFundTransactionsMock(mockTransactionIds),
        submitTransaction: transactionDeadErrorSubmitTransactionsMock,
      })

      const { userAccount, pack } = await setupUserAccountAndClaimedPack({
        knex,
        status: AlgorandTransactionStatus.Signed,
      })

      // Act
      let caughtError = null
      try {
        await claimPackService.ensureAccountMinBalanceForPack({
          packId: pack.id,
          step,
        })
      } catch (error) {
        caughtError = error
      }

      // Assert
      expect(caughtError).toBeTruthy()
      expect(caughtError).toBe(transactionDeadErrorSubmitTransactionsMock.error)

      const updatedUserAccount = await getUserAccountAndTransactions(
        userAccount.id
      )

      // the first transaction specifically should be user.algorandAccount.creationTransactionId
      expectAccountCreationTransactionToBeNull(updatedUserAccount)

      // at this point no transactions or groups should exist
      await expectAllTransactionsCountToBe(0)
      await expectAllTransactionGroupsCountToBe(0)
    })
  })

  // eslint-disable-next-line jest/expect-expect
  test('No-ops if funding is already complete', async () => {
    const claimPackService = resolver.get<ClaimPackService>(
      ClaimPackService.name
    )
    // Arrange
    const mockTransactionIds = [
      fakeAddressFor('transaction'),
      fakeAddressFor('transaction'),
    ]
    setupAlgorandAdapterMockImplementations({
      initialFundTransactions:
        generateSuccessfulInitialFundTransactionsMock(mockTransactionIds),
      submitTransaction: genericUnsuccessfulSubmitTransactionMock,
    })

    const { userAccount, pack } = await setupUserAccountAndClaimedPack({
      knex,
      status: AlgorandTransactionStatus.Confirmed,
    })

    // Act
    await claimPackService.ensureAccountMinBalanceForPack({
      packId: pack.id,
      step,
    })

    // Assert
    // Act
    await claimPackService.ensureAccountMinBalanceForPack({
      packId: pack.id,
      step,
    })

    // Assert
    const updatedUserAccount = await getUserAccountAndTransactions(
      userAccount.id
    )

    const originalTransactions =
      userAccount.algorandAccount.creationTransaction.group.transactions
    const updatedTransactions =
      updatedUserAccount.algorandAccount.creationTransaction.group.transactions

    // the set of transactions associated with the account should not have changed
    expectTransactionAddressesToMatch(
      updatedTransactions,
      originalTransactions.map((trx) => trx.address)
    )

    // all transactions should be recorded as confirmed now
    expectTransactionsToBeConfirmed(updatedTransactions)

    // user.algorandAccount.creationTransactionId should not have changed
    expectAccountCreationTransactionAddressToMatch(
      updatedUserAccount,
      originalTransactions[0].address
    )

    // at this point no other transactions or groups should exist
    await expectAllTransactionsCountToBe(originalTransactions.length)
    await expectAllTransactionGroupsCountToBe(1)
  })
})

function expectAccountCreationTransactionAddressToMatch(userAccount, address) {
  expect(userAccount.algorandAccount.creationTransaction.address).toBe(address)
}

function expectAccountCreationTransactionToBeNull(userAccount) {
  expect(userAccount.algorandAccount.creationTransactionId).toBeNull()
}
