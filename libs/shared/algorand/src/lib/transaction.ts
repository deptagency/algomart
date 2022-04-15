import type { Algodv2 } from 'algosdk'
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
}

/**
 * Transforms transaction info from algod.pendingTransactionInformation into a better typed object.
 * @param info The transaction info to transform
 * @returns A better typed version of the transaction info
 */
export function transformTransactionInfo(
  info: Record<string, unknown>
): TransactionInfo {
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
  return transformTransactionInfo(info)
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
  return transformTransactionInfo(
    await waitForConfirmation(algod, txID, waitRounds)
  )
}
