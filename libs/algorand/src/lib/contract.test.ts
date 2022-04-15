import algosdk from 'algosdk'
import { createDeployContractTransactions, makeStateConfig } from './contract'
import {
  configureAlgod,
  createCompileMock,
  createGetTransactionParamsMock,
} from './test-utils'

let algod: algosdk.Algodv2
jest.fn
beforeEach(() => {
  algod = configureAlgod()
})

describe('createDeployContractTransactions', () => {
  it('should create app create txn', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    algod.compile = createCompileMock({
      // This is the actual compiled code for the contract source defined below
      hash: 'ZG2RRCHBZ4K2QKP3NGMYVF2MVG7YW2TSNJPVFVLEGX7KGQ46QVPJGOFTK4',
      result: 'BoEB',
    })
    const creatorAccount = algosdk.generateAccount()
    const source = '#pragma version 6\nint 1'

    // Act
    const result = await createDeployContractTransactions({
      algod,
      approvalSource: source,
      clearSource: source,
      contractName: 'test',
      creatorAccount,
      globalState: makeStateConfig(0, 0),
      localState: makeStateConfig(0, 0),
    })

    // Assert
    expect(result).toBeDefined()
    expect(result.groupID).toBeUndefined()
    expect(result.txIDs).toHaveLength(1)
    expect(result.signedTxns).toHaveLength(1)
    expect(result.txns).toHaveLength(1)
    expect(result.txns[0].type).toBe(algosdk.TransactionType.appl)
  })
})
