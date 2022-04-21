import algosdk from 'algosdk'
import { configureAlgod, createGetTransactionParamsMock } from './test-utils'
import {
  configureSignTxns,
  decodeRawSignedTransaction,
  encodeRawSignedTransaction,
  encodeSignedTransactions,
  encodeTransaction,
  encodeTransactions,
  WalletError,
} from './wallet'

let algod: algosdk.Algodv2
jest.fn
beforeEach(() => {
  algod = configureAlgod()
})

describe('configureSignTxns', () => {
  it('returns a function', async () => {
    // Arrange
    const account = algosdk.generateAccount()

    // Act
    const signTxns = await configureSignTxns([account])

    // Assert
    expect(typeof signTxns).toBe('function')
  })

  it('should require at least one transaction', async () => {
    // Arrange
    const account = algosdk.generateAccount()

    // Act
    const signTxns = await configureSignTxns([account])

    // Assert
    expect(() => signTxns([])).rejects.toBeInstanceOf(WalletError)
  })

  it('should not require group for single txn', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account = algosdk.generateAccount()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const txns = [await encodeTransaction(txn)]

    // Act
    const signTxns = await configureSignTxns([account])
    const signedTxns = await signTxns(txns)

    // Assert
    expect(signedTxns).toHaveLength(1)
    expect(signedTxns[0]).toBeDefined()
    expect(typeof signedTxns[0]).toBe('string')
  })

  it('should require group for multiple txns', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account = algosdk.generateAccount()
    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 1,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    // Intentionally not using `encodeTransactions` here to ensure groupID is not set
    const txns = [await encodeTransaction(txn1), await encodeTransaction(txn2)]

    // Act
    const signTxns = await configureSignTxns([account])

    // Assert
    expect(() => signTxns(txns)).rejects.toBeInstanceOf(WalletError)
  })

  it('should work with multiple txns when group is set', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account = algosdk.generateAccount()
    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 1,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const txns = await encodeTransactions([txn1, txn2])

    // Act
    const signTxns = await configureSignTxns([account])
    const signedTxns = await signTxns(txns)

    // Assert
    expect(signedTxns).toHaveLength(2)
    expect(signedTxns[0]).toBeDefined()
    expect(signedTxns[1]).toBeDefined()
    expect(typeof signedTxns[0]).toBe('string')
    expect(typeof signedTxns[1]).toBe('string')
  })

  it('should skip signing if signers is set to empty array', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account = algosdk.generateAccount()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const txns = await encodeTransactions([txn])
    txns[0].signers = []

    // Act
    const signTxns = await configureSignTxns([account])
    const signedTxns = await signTxns(txns)

    // Assert
    expect(signedTxns).toHaveLength(1)
    expect(signedTxns[0]).toBe(null)
  })

  it('should return stxn when set', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account = algosdk.generateAccount()
    const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 1,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const signer = algosdk.makeBasicAccountTransactionSigner(account)
    const txns = await encodeSignedTransactions([txn1, txn2], [signer, signer])

    // Act
    const signTxns = await configureSignTxns([account])
    const signedTxns = await signTxns(txns)

    // Assert
    expect(signedTxns).toHaveLength(2)
    expect(signedTxns[0]).toBeDefined()
    expect(signedTxns[1]).toBeDefined()
    expect(typeof signedTxns[0]).toBe('string')
    expect(typeof signedTxns[1]).toBe('string')
  })

  it('should use specified signer when present', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account = algosdk.generateAccount()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const txns = await encodeTransactions([txn])
    txns[0].signers = [account.addr]

    // Act
    const signTxns = await configureSignTxns([account])
    const signedTxns = await signTxns(txns)

    // Assert
    expect(signedTxns).toHaveLength(1)
    expect(signedTxns[0]).toBeDefined()
    expect(typeof signedTxns[0]).toBe('string')
  })

  it('should use authAddr when present', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account1 = algosdk.generateAccount()
    const account2 = algosdk.generateAccount()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account1.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account1.addr,
    })
    const txns = await encodeTransactions([txn])
    txns[0].authAddr = account2.addr

    // Act
    const signTxns = await configureSignTxns([account1, account2])
    const signedTxns = await signTxns(txns)

    // Assert
    expect(signedTxns).toHaveLength(1)
    expect(signedTxns[0]).toBeDefined()
    expect(typeof signedTxns[0]).toBe('string')
  })

  it('should require authAddr to match signer when both present', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account1 = algosdk.generateAccount()
    const account2 = algosdk.generateAccount()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account1.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account1.addr,
    })
    const txns = await encodeTransactions([txn])
    txns[0].signers = [account2.addr]
    txns[0].authAddr = account2.addr

    // Act
    const signTxns = await configureSignTxns([account1, account2])
    const signedTxns = await signTxns(txns)

    // Assert
    expect(signedTxns).toHaveLength(1)
    expect(signedTxns[0]).toBeDefined()
    expect(typeof signedTxns[0]).toBe('string')
  })

  it('should reject msig until supported', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account1 = algosdk.generateAccount()
    const account2 = algosdk.generateAccount()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account1.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account1.addr,
    })
    const txns = await encodeTransactions([txn])
    txns[0].signers = [account1.addr, account2.addr]

    // Act
    const signTxns = await configureSignTxns([account1, account2])

    // Assert
    expect(() => signTxns(txns)).rejects.toBeInstanceOf(WalletError)
  })
})

describe('encode+decode raw signed transaction', () => {
  it('should work', async () => {
    // Arrange
    algod.getTransactionParams = createGetTransactionParamsMock()
    const account = algosdk.generateAccount()
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      amount: 0,
      from: account.addr,
      suggestedParams: await algod.getTransactionParams().do(),
      to: account.addr,
    })
    const signedTxn = txn.signTxn(account.sk)

    // Act
    const encoded = encodeRawSignedTransaction(signedTxn)
    const decoded = decodeRawSignedTransaction(encoded)

    // Assert
    expect(encoded).toBeDefined()
    expect(decoded).toBeDefined()
    expect(typeof encoded).toBe('string')
    expect(decoded).toBeInstanceOf(Uint8Array)
    expect(signedTxn).toEqual(decoded)
  })
})
