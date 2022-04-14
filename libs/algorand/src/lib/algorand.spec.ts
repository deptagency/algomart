import algosdk, { SuggestedParams } from 'algosdk'
import HTTPClient from 'algosdk/dist/types/src/client/client'
import {
  createConfigureCustodialAccountTransactions,
  createNFTTransactions,
} from './algorand'

function createGetTransactionParamsMock(params: Partial<SuggestedParams> = {}) {
  return jest.fn(() => ({
    do: jest.fn(() =>
      Promise.resolve<SuggestedParams>({
        genesisHash: 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
        genesisID: 'testnet-v1.0',
        firstRound: 1000,
        lastRound: 2000,
        fee: 1000,
        ...params,
      })
    ),
    path: jest.fn(),
    prepare: jest.fn(),
    setIntDecoding: jest.fn(),
    c: {} as unknown as HTTPClient,
    intDecoding: algosdk.IntDecoding.DEFAULT,
    query: {},
  }))
}

let algod: algosdk.Algodv2

beforeEach(() => {
  // Configure a valid algod instance
  // Though we will be mocking any responses from it as needed
  algod = new algosdk.Algodv2(
    '',
    'https://node.testnet.algoexplorerapi.io/v2',
    ''
  )
})

describe('createConfigureCustodialAccountTransactions', () => {
  it('should generate pay and keyreg transactions', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const custodialAccount = algosdk.generateAccount()
    const fundingAccount = algosdk.generateAccount()

    // Act
    const result = await createConfigureCustodialAccountTransactions({
      algod,
      custodialAccount,
      fundingAccount,
    })

    // Assert
    expect(result).toBeDefined()
    expect(result.groupID).toBeDefined()
    expect(result.txIDs).toHaveLength(2)
    expect(result.signedTxns).toHaveLength(2)
    expect(result.txns).toHaveLength(2)
    expect(result.txns[0].type).toBe(algosdk.TransactionType.pay)
    expect(result.txns[1].type).toBe(algosdk.TransactionType.keyreg)
  })
})

describe('createNFTTransactions', () => {
  it('should generate asset create transactions', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const creatorAccount = algosdk.generateAccount()

    // Act
    const result = await createNFTTransactions({
      algod,
      creatorAccount,
      nfts: [
        {
          assetMetadataHash: new Uint8Array(0),
          assetName: 'My NFT',
          assetURL: 'https://example.com/nft',
          edition: 1,
          totalEditions: 10,
          unitName: 'NFT',
        },
      ],
    })

    // Assert
    expect(result).toBeDefined()
    // Since only single NFT is being created, groupID will be left undefined
    expect(result.groupID).toBeUndefined()
    expect(result.txIDs).toHaveLength(1)
    expect(result.signedTxns).toHaveLength(1)
    expect(result.txns).toHaveLength(1)
    expect(result.txns[0].type).toBe(algosdk.TransactionType.acfg)
  })
})
