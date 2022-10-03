import algosdk from 'algosdk'

import {
  configureAlgod,
  createGetPendingTransactionInformationMock,
} from './test-utils'
import { pendingTransactionInformation } from './transaction'

let algod: algosdk.Algodv2
jest.fn
beforeEach(() => {
  algod = configureAlgod()
})

describe('pendingTransactionInformation', () => {
  test('should call algod for trx info and return transformed value', async () => {
    // Arrange
    algod.pendingTransactionInformation =
      createGetPendingTransactionInformationMock({
        'application-index': 0,
        'asset-closing-amount': 0,
        'asset-index': 0,
        'close-rewards': 0,
        'confirmed-round': 0,
        'global-state-delta': {},
        'inner-txns': {},
        'local-state-delta': {},
        'pool-error': '',
        'receiver-rewards': 0,
        'sender-rewards': 0,
        txn: {},
        txID: '1000',
      })

    // Act
    const result = await pendingTransactionInformation(algod, '1000')

    // Assert
    expect(result).toBeDefined()
    expect(result).toEqual({
      applicationIndex: 0,
      assetClosingAmount: 0,
      assetIndex: 0,
      closeRewards: 0,
      confirmedRound: 0,
      globalStateDelta: {},
      innerTxns: {},
      localStateDelta: {},
      poolError: '',
      receiverRewards: 0,
      senderRewards: 0,
      txn: {},
      txID: '1000',
    })
  })
})
