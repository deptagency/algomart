import {
  AlgorandAccountSig,
  AlgorandAccountStatus,
  AlgorandTransformedAccountInfo,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  decodeRawSignedTransaction,
  TransactionInfo,
} from '@algomart/shared/algorand'
import { jest } from '@jest/globals'

import { MethodLikeKeys } from './jest-types'

// Sets up a sensible default mock that mimics successful operations.
// override the mocked implementations as necessary. Override with null to
// use actual implementation
export function setupAlgorandAdapterMockImplementations(
  prototypeOverrides = {},
  staticOverrides = {}
) {
  const defaultStaticMocks = {}
  const staticMocks = { ...defaultStaticMocks, ...staticOverrides }
  for (const propertyName in staticMocks) {
    if (staticMocks[propertyName]) {
      jest
        .spyOn(AlgorandAdapter, propertyName as never)
        .mockImplementation(staticMocks[propertyName])
    }
  }

  const defaultPrototypeMocks = {
    testConnection: successfulTestConnectionMock,
    initialFundTransactions: generateSuccessfulInitialFundTransactionsMock([]),
    generateCreateAssetTransactions:
      generateSuccessfulCreateAssetTransactionsMock([]),
    submitTransaction: successfulSubmitTransactionMock,
    waitForConfirmation: successfulWaitForConfirmationMock,
    waitForAllConfirmations: successfulWaitForAllConfirmationsMock,
    getAccountInfo: successfulGetAccountInfoMock([], 100_000),
    getAssetOwner: successfulGetAssetOwnerMock(),
  }
  const prototypeMocks = { ...defaultPrototypeMocks, ...prototypeOverrides }
  for (const propertyName in prototypeMocks) {
    if (prototypeMocks[propertyName]) {
      jest
        .spyOn(
          AlgorandAdapter.prototype,
          propertyName as MethodLikeKeys<AlgorandAdapter>
        )
        .mockImplementation(prototypeMocks[propertyName])
    }
  }
}

/**
 * Generate fake Algorand Account address and Algorand Transaction ID
 */
export function fakeAddressFor(type: 'account' | 'transaction') {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const size = type === 'account' ? 58 : 52
  const result = []
  while (result.length < size) {
    result.push(alphabet[Math.floor(Math.random() * alphabet.length)])
  }

  return result.join('')
}

export function successfulTestConnectionMock() {
  return Promise.resolve()
}

export function generateSuccessfulInitialFundTransactionsMock(transactionIds) {
  const mockResponse = {
    signedTransactions: transactionIds.map((id) =>
      decodeRawSignedTransaction(`${id}-signed-trx-data`)
    ),
    transactionIds,
  }
  return () => Promise.resolve(mockResponse)
}

export function generateSuccessfulCreateAssetTransactionsMock(transactionIds) {
  const mockResponse = {
    signedTransactions: transactionIds.map((id) =>
      decodeRawSignedTransaction(`${id}-signed-trx-data`)
    ),
    transactionIds,
  }
  return () => Promise.resolve(mockResponse)
}

export function successfulSubmitTransactionMock() {
  return Promise.resolve()
}

export function successfulWaitForConfirmationMock(transactionId) {
  return Promise.resolve({
    poolError: null,
    assetIndex: 1234,
    txID: transactionId,
    confirmedRound: 1,
  } as TransactionInfo)
}

export function successfulWaitForAllConfirmationsMock(transactionIds) {
  return Promise.all(
    transactionIds.map((id) =>
      Promise.resolve({
        poolError: null,
        assetIndex: 1234,
        txID: id,
        confirmedRound: 1,
      } as TransactionInfo)
    )
  )
}

export function successfulGetAccountInfoMock(
  ownedAssetIndexes: number[],
  overrideBalance?: number
) {
  return async (address: string): Promise<AlgorandTransformedAccountInfo> => {
    const minBalance = 100_000 + ownedAssetIndexes.length * 100_000
    return {
      address,
      assets: ownedAssetIndexes.map((index) => ({
        amount: 1,
        assetIndex: index,
        isFrozen: true,
      })),
      amount: overrideBalance ?? minBalance,
      amountWithoutPendingRewards: 0,
      pendingRewards: 0,
      rewards: 0,
      round: 0,
      sigType: AlgorandAccountSig.Sig,
      status: AlgorandAccountStatus.NotParticipating,
      totalAppsOptedIn: 0,
      totalAssetsOptedIn: ownedAssetIndexes.length,
      totalCreatedApps: 0,
      totalCreatedAssets: 0,
    }
  }
}

export function successfulGetAssetOwnerMock(
  ownerAddress?: string,
  overrideBalance?: number
) {
  return async (
    assetIndex: number
  ): Promise<AlgorandTransformedAccountInfo | null> => {
    if (!ownerAddress) return null

    const minBalance = 200_000
    return {
      address: ownerAddress,
      assets: [{ amount: 1, assetIndex, isFrozen: true }],
      amount: overrideBalance ?? minBalance,
      amountWithoutPendingRewards: 0,
      pendingRewards: 0,
      rewards: 0,
      round: 0,
      sigType: AlgorandAccountSig.Sig,
      status: AlgorandAccountStatus.NotParticipating,
      totalAppsOptedIn: 0,
      totalAssetsOptedIn: 1,
      totalCreatedApps: 0,
      totalCreatedAssets: 0,
    }
  }
}

const error = new Error('UNSUCCESSFUL TRANSACTION SUBMIT')
genericUnsuccessfulSubmitTransactionMock.error = error
export function genericUnsuccessfulSubmitTransactionMock() {
  return Promise.reject(error)
}

export function alreadyInLedgerErrorSubmitTransactionMock() {
  return Promise.reject({
    response: {
      body: {
        message:
          'TransactionPool.Remember: transaction already in ledger: GOOOOAAAAALLLLLLLL MESSI MESSI MESSI',
      },
    },
  } as unknown as Error)
}

const transactionDeadErrorSubmitTransactionsMockError = {
  response: {
    body: {
      message:
        'TransactionPool.Remember: txn dead: GOOOOAAAAALLLLLLLL RONALDOOOOO',
    },
  },
} as unknown as Error
transactionDeadErrorSubmitTransactionsMock.error =
  transactionDeadErrorSubmitTransactionsMockError
export function transactionDeadErrorSubmitTransactionsMock() {
  return Promise.reject(transactionDeadErrorSubmitTransactionsMockError)
}
