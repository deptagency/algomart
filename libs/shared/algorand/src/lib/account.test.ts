import algosdk from 'algosdk'
import {
  accountInformation,
  createConfigureCustodialAccountTransactions,
  decryptAccount,
  encryptAccount,
  generateAccount,
} from './account'
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

describe('createConfigureCustodialAccountTransactions', () => {
  it('should generate pay and keyreg transactions', async () => {
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
  it('should work', async () => {
    // Arrange
    const account = await generateAccount()
    const passphrase = '000000'
    const appSecret = 'appSecret'

    // Act
    const encrypted = await encryptAccount(account, passphrase, appSecret)
    const decrypted = await decryptAccount(encrypted, passphrase, appSecret)

    // Assert
    expect(decrypted).toBeDefined()
    expect(decrypted.addr).toBe(account.addr)
  })
})

describe('accountInformation', () => {
  it('should work', async () => {
    // Arrange
    const account = await generateAccount()
    algod.accountInformation = createAccountInformationMock({
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
    const result = await accountInformation(algod, account.addr)

    // Assert
    expect(result.address).toBe(account.addr)
  })
})
