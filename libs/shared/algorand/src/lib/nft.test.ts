import algosdk from 'algosdk'
import {
  ARC3Metadata,
  buildMetadata,
  createClawbackNFTTransactions,
  createExportNFTTransactions,
  createImportNFTTransactions,
  createNewNFTsTransactions,
} from './nft'
import {
  configureAlgod,
  createAccountInformationMock,
  createGetTransactionParamsMock,
} from './test-utils'

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

describe('buildMetadata', () => {
  it('should create a metadata object', () => {
    // Arrange
    const expected: ARC3Metadata = {
      name: 'My NFT',
      description: 'Some description',
      decimals: 0,
      image: 'https://example.com/nft',
      animation_url: 'https://example.com/nft',
      background_color: '#000000',
      external_url: 'https://example.com/nft',
      properties: {
        key2: 'value2',
      },
      extra_metadata: 'ZW5jb2RlZCB0ZXh0',
      localization: {
        uri: 'https://example.com/{locale}.json',
        default: 'en',
        locales: ['en', 'es', 'fr'],
      },
    }

    // Act
    const actual = buildMetadata()
      .name('My NFT')
      .description('Some description')
      .decimals(0)
      .image('https://example.com/nft')
      .animation('https://example.com/nft')
      .backgroundColor('#000000')
      .external('https://example.com/nft')
      .property('key1', 'value1')
      .properties({ key2: 'value2' })
      .extraMetadata('ZW5jb2RlZCB0ZXh0')
      .localization('https://example.com/{locale}.json', 'en', [
        'en',
        'es',
        'fr',
      ])

    // Assert
    expect(actual.build()).toEqual(expected)
    expect(actual.toJSON()).toBe(JSON.stringify(expected))
  })
})

describe('createExportNFTTransactions', () => {
  it('should generate export txns', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    algod.accountInformation = createAccountInformationMock({})
    const fundingAccount = algosdk.generateAccount()
    const currentOwnerAccount = algosdk.generateAccount()
    const recipientAccount = algosdk.generateAccount()

    // Act
    const result = await createExportNFTTransactions({
      algod,
      assetIndex: 1,
      clawbackAddress: fundingAccount.addr,
      fromAddress: currentOwnerAccount.addr,
      fundingAddress: fundingAccount.addr,
      toAddress: recipientAccount.addr,
    })

    // Assert
    expect(result).toBeDefined()
    expect(result).toHaveLength(5)
  })
})

describe('createImportNFTTransactions', () => {
  it('should generate import txns', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    algod.accountInformation = createAccountInformationMock({
      assets: [{ assetIndex: 2 }],
      amount: 0,
    })
    const fundingAccount = algosdk.generateAccount()
    const currentOwnerAccount = algosdk.generateAccount()
    const recipientAccount = algosdk.generateAccount()

    // Act
    const result = await createImportNFTTransactions({
      algod,
      assetIndex: 1,
      clawbackAddress: fundingAccount.addr,
      fromAddress: currentOwnerAccount.addr,
      fundingAddress: fundingAccount.addr,
      toAddress: recipientAccount.addr,
    })

    // Assert
    expect(result).toBeDefined()
    expect(result).toHaveLength(4)
  })
})
