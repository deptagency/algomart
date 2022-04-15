import algosdk from 'algosdk'
import { createConfigureCustodialAccountTransactions } from './account'
import { createGetTransactionParamsMock } from './test-utils'
import { configureAlgod } from './test-utils'

let algod: algosdk.Algodv2
jest.fn
beforeEach(() => {
  algod = configureAlgod()
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
