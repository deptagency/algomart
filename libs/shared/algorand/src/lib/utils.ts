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

export enum ChainType {
  MainNet = 'mainnet',
  TestNet = 'testnet',
  BetaNet = 'betanet',
}

export const UsdcAssetIdByChainType = {
  [ChainType.TestNet]: 10_458_941,
  [ChainType.MainNet]: 31_566_704,
}

/**
 * Lazy-loading the algosdk library
 * @returns The algosdk
 */
export async function loadSDK() {
  return import('algosdk')
}
