import { invariant } from '@algomart/shared/utils'

import { ARC2_DAPP_NAME_PATTERN } from './constants'

/**
 * Note types to use for ARC-2 txn notes
 */
export enum NoteTypes {
  CustodialInitialFundPayment = 'cifp',
  CustodialInitialNonParticipation = 'cinp',

  NonFungibleTokenCreate = 'nftc',

  ClawbackTransferPayFunds = 'ctpf',
  ClawbackTransferOptIn = 'ctoi',
  ClawbackTransferTxn = 'cttx',

  ContractDeploy = 'codp',

  ExportTransferPayFunds = 'etpf',
  ExportTransferOptIn = 'etoi',
  ExportTransferAsset = 'etax',
  ExportTransferOptOut = 'etoo',
  ExportTransferReturnFunds = 'etrf',

  ImportTransferPayFunds = 'itpf',
  ImportTransferOptIn = 'itoi',
  ImportTransferAsset = 'itax',
  ImportTransferOptOut = 'itoo',

  TradeTransferPayFunds = 'ttpf',
  TradeTransferOptIn = 'ttoi',
  TradeTransferAsset = 'ttax',
  TradeTransferOptOut = 'ttoo',
  TradeTransferReturnFunds = 'ttrf',
}

/**
 * Generates an ARC-2 compliant JSON-encoded transaction note.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0002.md
 * @param dappName The name of the dApp
 * @param noteData Arbitrary data to be included in the note
 * @returns The encoded note
 */
export function encodeNote(
  dappName: string,
  noteData: Record<string, unknown>
): Uint8Array {
  invariant(
    dappName.match(ARC2_DAPP_NAME_PATTERN),
    `Invalid dapp name: ${dappName}`
  )
  const note = `${dappName}:j${JSON.stringify(noteData)}`
  return new Uint8Array(Buffer.from(note, 'utf8'))
}
