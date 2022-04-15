import algosdk from 'algosdk'
import { configureAlgod, createGetTransactionParamsMock } from './test-utils'
import { createClawbackNFTTransactions, createNewNFTsTransactions } from './nft'

let algod: algosdk.Algodv2
jest.fn
beforeEach(() => {
  algod = configureAlgod()
})

describe('createNewNFTsTransactions', () => {
  it('should generate asset create transactions', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const creatorAccount = algosdk.generateAccount()

    // Act
    const result = await createNewNFTsTransactions({
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

describe('createClawbackNFTTransactions', () => {
  it('should clawback with opt-in', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const fundingAccount = algosdk.generateAccount()
    const recipientAccount = algosdk.generateAccount()

    // Act
    const result = await createClawbackNFTTransactions({
      algod,
      assetIndex: 1,
      clawbackAccount: fundingAccount,
      currentOwnerAddress: fundingAccount.addr,
      recipientAddress: recipientAccount.addr,
      fundingAccount: fundingAccount,
      recipientAccount: recipientAccount,
      skipOptIn: false,
    })

    // Assert
    expect(result).toBeDefined()
    expect(result.groupID).toBeDefined()
    expect(result.txIDs).toHaveLength(3)
    expect(result.signedTxns).toHaveLength(3)
    expect(result.txns).toHaveLength(3)
    expect(result.txns[0].type).toBe(algosdk.TransactionType.pay)
    expect(result.txns[1].type).toBe(algosdk.TransactionType.axfer)
    expect(result.txns[2].type).toBe(algosdk.TransactionType.axfer)
  })

  it('should clawback without opt-in', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const fundingAccount = algosdk.generateAccount()
    const currentOwnerAccount = algosdk.generateAccount()
    const recipientAccount = algosdk.generateAccount()

    // Act
    const result = await createClawbackNFTTransactions({
      algod,
      assetIndex: 1,
      clawbackAccount: fundingAccount,
      currentOwnerAddress: currentOwnerAccount.addr,
      recipientAddress: recipientAccount.addr,
      skipOptIn: true,
    })

    // Assert
    expect(result).toBeDefined()
    expect(result.groupID).toBeUndefined()
    expect(result.txIDs).toHaveLength(1)
    expect(result.signedTxns).toHaveLength(1)
    expect(result.txns).toHaveLength(1)
    expect(result.txns[0].type).toBe(algosdk.TransactionType.axfer)
  })
})
