import {
  AlgorandSendRawTransaction,
  AlgorandTransformedPendingTransactionInfo,
  AlgorandTransformedTransactionInfo,
} from '@algomart/schemas'
import {
  Algodv2,
  BaseHTTPClientError,
  Indexer,
  SuggestedParams,
  TransactionType,
} from 'algosdk'

import { loadSDK } from './utils'

/**
 * Typed version of a pending transaction response.
 * @see https://developer.algorand.org/docs/rest-apis/algod/v2/#pendingtransactionresponse
 */
export type TransactionInfo = {
  applicationIndex?: number
  assetClosingAmount?: number
  assetIndex?: number
  closeRewards?: number
  closingAmount?: number
  confirmedRound?: number
  globalStateDelta?: Record<string, unknown>[]
  innerTxns?: Record<string, unknown>[]
  localStateDelta?: Record<string, unknown>[]
  // logs: string[] // TODO: not sure about this type? though may not be needed
  poolError: string
  receiverRewards?: number
  senderRewards?: number
  txn: Record<string, unknown>
  txID: string
}

export interface AlgorandErrorResponse {
  message: string
}

/**
 * Transforms transaction info from algod.pendingTransactionInformation into a better typed object.
 * @param info The transaction info to transform
 * @returns A better typed version of the transaction info
 */
export function transformPendingTransactionInfo(
  info: Record<string, unknown>,
  txID: string
): AlgorandTransformedPendingTransactionInfo {
  return {
    applicationIndex: info['application-index'] as number,
    assetClosingAmount: info['asset-closing-amount'] as number,
    assetIndex: info['asset-index'] as number,
    closeRewards: info['close-rewards'] as number,
    confirmedRound: info['confirmed-round'] as number,
    globalStateDelta: info['global-state-delta'] as Record<string, unknown>[],
    innerTxns: info['inner-txns'] as Record<string, unknown>[],
    localStateDelta: info['local-state-delta'] as Record<string, unknown>[],
    // logs: info['logs'] as string[],
    poolError: info['pool-error'] as string,
    receiverRewards: info['receiver-rewards'] as number,
    senderRewards: info['sender-rewards'] as number,
    txn: info['txn'] as Record<string, unknown>,
    txID,
  }
}

export function transformTransactionInfo(
  info: Record<string, unknown>,
  txID: string
): AlgorandTransformedTransactionInfo {
  return {
    applicationTransaction: info['application-transaction'] as Record<
      string,
      unknown
    >,
    assetConfigTransaction: info['asset-config-transaction'] as Record<
      string,
      unknown
    >,
    assetFreezeTransaction: info['asset-freeze-transaction'] as Record<
      string,
      unknown
    >,
    assetTransferTransaction: info['asset-transfer-transaction'] as Record<
      string,
      unknown
    >,
    authAddr: info['authAddr'] as string,
    closeRewards: info['close-rewards'] as number,
    closingAmount: info['closing-amount'] as number,
    confirmedRound: info['confirmed-round'] as number,
    createdApplicationIndex: info['created-application-index'] as number,
    createdAssetIndex: info['created-asset-index'] as number,
    fee: info['fee'] as number,
    firstValid: info['first-valid'] as number,
    genesisHash: info['genesis-hash'] as string,
    genesisId: info['genesis-id'] as string,
    globalStateDelta: info['global-state-delta'] as Record<string, unknown>,
    group: info['group'] as string,
    id: txID,
    innerTxns: info['inner-txns'] as Record<string, unknown>[],
    intraRoundOffset: info['intra-round-offset'] as number,
    keyRegTransaction: info['key-reg-transaction'] as Record<string, unknown>,
    lastValid: info['last-valid'] as number,
    lease: info['lease'] as string,
    localStateDelta: info['local-state-delta'] as Record<string, unknown>[],
    logs: info['logs'] as string[],
    note: info['note'] as string,
    paymentTransaction: info['payment-transaction'] as Record<string, unknown>,
    receiverRewards: info['receiver-rewards'] as number,
    rekeyTo: info['rekey-to'] as string,
    roundTime: info['round-time'] as number,
    sender: info['sender'] as string,
    senderRewards: info['sender-rewards'] as number,
    signature: info['signature'] as Record<string, unknown>,
    txType: info['tx-type'] as TransactionType,
  }
}

/**
 * Get transformed transaction information by transaction ID.
 * @param algod Initialized Algodv2 client
 * @param txID Transaction ID to get info for
 * @returns Transformed transaction info
 */
export async function pendingTransactionInformation(
  algod: Algodv2,
  txID: string
) {
  const info = await algod.pendingTransactionInformation(txID).do()
  return transformPendingTransactionInfo(info, txID)
}

/**
 * Wrapper around waitForConfirmation that waits for a transaction to be confirmed
 * @param algod Initialized Algodv2 client
 * @param txID Txn to wait for
 * @param waitRounds Max number of rounds to wait for
 * @returns Once resolved, returns the transaction info
 */
export async function waitForConfirmation(
  algod: Algodv2,
  txID: string,
  waitRounds: number
): Promise<TransactionInfo> {
  const { waitForConfirmation } = await loadSDK()
  return transformPendingTransactionInfo(
    await waitForConfirmation(algod, txID, waitRounds),
    txID
  )
}

// Analyze and error object to figure out if it's an "already in ledger" error
// TODO: string comparison is NOT IDEAL. Algorand needs to improve their SDK
// https://github.com/algorand-devrel/challenges/issues/3
export function isAlreadyInLedgerError(error: BaseHTTPClientError) {
  // the type definition for response.body is UInt8Array but testing shows that
  // at least in this case, it's an object with a message property
  return (
    error?.response?.body as unknown as AlgorandErrorResponse
  )?.message?.startsWith(
    'TransactionPool.Remember: transaction already in ledger:'
  )
}

export function isTransactionDeadError(error: BaseHTTPClientError) {
  return (
    error?.response?.body as unknown as AlgorandErrorResponse
  )?.message?.startsWith('TransactionPool.Remember: txn dead:')
}

/**
 *
 * @param indexer Initialized Indexer client
 * @param txID Txn to lookup
 * @returns Once resolved, returns the transaction info
 */
export async function lookupTransaction(
  indexer: Indexer,
  txID: string
): Promise<AlgorandTransformedTransactionInfo> {
  const { transaction } = await indexer.lookupTransactionByID(txID).do()
  return transformTransactionInfo(transaction, txID)
}

/**
 *
 * @param algod Initialized algod client
 * @returns Suggested Transaction params
 */
export async function getTransactionParams(
  algod: Algodv2
): Promise<SuggestedParams> {
  return await algod.getTransactionParams().do()
}

export async function sendRawTransaction(
  algod: Algodv2,
  transaction: AlgorandSendRawTransaction
): Promise<string> {
  const { txId } = await algod
    .sendRawTransaction(transaction as Uint8Array | Uint8Array[])
    .do()

  return txId
}
