import algosdk from 'algosdk'

import {
  createConfigureCustodialAccountTransactions,
  decryptAccount,
  encryptAccount,
  generateAccount,
  lookupAccount,
} from './account'
import {
  configureAlgod,
  configureIndexer,
  createGetTransactionParamsMock,
  createLookupAccountByIDMock,
} from './test-utils'

let algod: algosdk.Algodv2
let indexer: algosdk.Indexer
jest.fn
beforeEach(() => {
  algod = configureAlgod()
  indexer = configureIndexer()
})

describe('createConfigureCustodialAccountTransactions', () => {
  test('should generate pay and keyreg transactions', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const custodialAccount = await generateAccount()
    const fundingAccount = await generateAccount()

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

describe('encryptAccount + decryptAccount', () => {
  test('should work', async () => {
    // Arrange
    const account = await generateAccount()
    const appSecret = 'appSecret'

    // Act
    const encrypted = await encryptAccount(account, appSecret)
    const decrypted = await decryptAccount(encrypted, appSecret)

    // Assert
    expect(decrypted).toBeDefined()
    expect(decrypted.addr).toBe(account.addr)
  })
})

describe('lookupAccount', () => {
  test('should work', async () => {
    // Arrange
    const account = await generateAccount()
    indexer.lookupAccountByID = createLookupAccountByIDMock({
      address: account.addr,
      assets: [
        {
          'asset-id': 123,
          amount: 1,
          'is-frozen': false,
        },
      ],
    })

    // Act
    const result = await lookupAccount(indexer, account.addr)

    // Assert
    expect(result.address).toBe(account.addr)
  })
})
