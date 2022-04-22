import type { Transaction } from 'algosdk'

/**
 * List of txn IDs, unsigned txns, and signed txns.
 */
export type TransactionList = {
  groupID?: string
  txIDs: string[]
  txns: Transaction[]
  signedTxns: Uint8Array[]
}

/**
 * Lazy-loading the algosdk library
 * @returns The algosdk
 */
export async function loadSDK() {
  return import('algosdk')
}
