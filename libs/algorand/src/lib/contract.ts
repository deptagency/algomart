import type { Account, Algodv2, OnApplicationComplete } from 'algosdk'
import { DEFAULT_ADDITIONAL_ROUNDS, DEFAULT_DAPP_NAME } from './constants'
import { encodeNote, NoteTypes } from './note'
import { loadSDK } from './utils'

export type StateConfig = {
  numByteSlices: number
  numInts: number
}

export const makeStateConfig = (
  numInts = 0,
  numByteSlices = 0
): StateConfig => ({ numInts, numByteSlices })

/**
 * Options for deploying contracts
 */
export type DeployContractOptions = {
  accounts?: string[]
  additionalRounds?: number
  algod: Algodv2
  appArgs?: Uint8Array[]
  approvalSource: string
  clearSource: string
  contractName: string
  creatorAccount: Account
  dappName?: string
  extraPages?: number
  foreignApps?: number[]
  foreignAssets?: number[]
  globalState: StateConfig
  lease?: Uint8Array
  localState: StateConfig
  onComplete?: OnApplicationComplete
  reference?: string
}

/**
 * Compiles a smart contract from TEAL and encodes it in a byte array
 * @param algod Initialized Algodv2 client to use compile
 * @param source TEAL source code
 * @returns Compiled and encoded contract
 */
export async function compileContract(algod: Algodv2, source: string) {
  const compiled = await algod.compile(source).do()
  return new Uint8Array(Buffer.from(compiled.result, 'base64'))
}

/**
 * Creates a transaction to deploy a smart contract.
 * @param options Options for deploying a smart contract
 * @param options.accounts Optional accounts that needs to be referenced in the contract
 * @param options.additionalRounds Optional additional rounds these transactions are valid for
 * @param options.algod Initialized Algodv2 client to get suggested params
 * @param options.appArgs Optional arguments to pass to the contract
 * @param options.approvalSource The approval program source code in TEAL
 * @param options.clearSource The clear state program source code in TEAL
 * @param options.contractName The name of the contract to include in the txn notes
 * @param options.creatorAccount The account that will deploy the contract
 * @param options.dappName Optional dApp name to use for the txn notes
 * @param options.extraPages Optional number of extra pages to allocate for the contract
 * @param options.foreignApps Optional list of foreign applications to reference in the contract
 * @param options.foreignAssets Optional list of foreign assets to reference in the contract
 * @param options.globalState The global state configuration
 * @param options.lease Optional lease program source code in TEAL
 * @param options.localState The local state configuration
 * @param options.onComplete Optional onComplete configuration for the contract
 * @param options.reference Optional reference to include in the txn notes
 * @returns Signed transactions to be submitted to the network
 */
export async function createDeployContractTransactions({
  accounts,
  additionalRounds = DEFAULT_ADDITIONAL_ROUNDS,
  algod,
  appArgs,
  approvalSource,
  clearSource,
  contractName,
  creatorAccount,
  dappName = DEFAULT_DAPP_NAME,
  extraPages,
  foreignApps,
  foreignAssets,
  globalState,
  lease,
  localState,
  onComplete,
  reference,
}: DeployContractOptions) {
  const {
    AtomicTransactionComposer,
    makeBasicAccountTransactionSigner,
    makeApplicationCreateTxnFromObject,
    OnApplicationComplete,
  } = await loadSDK()
  const suggestedParams = await algod.getTransactionParams().do()
  suggestedParams.lastRound += additionalRounds

  const atc = new AtomicTransactionComposer()
  const creatorSigner = makeBasicAccountTransactionSigner(creatorAccount)

  atc.addTransaction({
    signer: creatorSigner,
    txn: makeApplicationCreateTxnFromObject({
      approvalProgram: await compileContract(algod, approvalSource),
      clearProgram: await compileContract(algod, clearSource),
      from: creatorAccount.addr,
      numGlobalByteSlices: globalState.numByteSlices,
      numGlobalInts: globalState.numInts,
      numLocalByteSlices: localState.numByteSlices,
      numLocalInts: localState.numInts,
      onComplete: onComplete || OnApplicationComplete.NoOpOC,
      suggestedParams,
      accounts,
      appArgs,
      extraPages,
      foreignApps,
      foreignAssets,
      lease,
      note: encodeNote(dappName, {
        t: NoteTypes.ContractDeploy,
        r: reference,
        n: contractName,
        s: ['arc2'],
      }),
    }),
  })

  // Build transactions
  const group = atc.buildGroup()
  // Sign transactions
  const signedTxns = await atc.gatherSignatures()

  return {
    groupID: group[0].txn.group?.toString('base64'),
    signedTxns,
    txns: group.map((g) => g.txn),
    txIDs: group.map((g) => g.txn.txID()),
  }
}
