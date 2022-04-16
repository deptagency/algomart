import type { Account, Algodv2 } from 'algosdk'
import {
  DEFAULT_ADDITIONAL_ROUNDS,
  DEFAULT_DAPP_NAME,
  MAX_NFT_COUNT,
} from './constants'
import { encodeNote, NoteTypes } from './note'
import { TransactionList, loadSDK } from './utils'
import { invariant } from '@algomart/shared/utils'

/**
 * Configuration for a single NFT
 */
export type NewNFT = {
  assetName: string
  unitName: string
  assetURL: string
  assetMetadataHash: Uint8Array
  edition: number
  totalEditions: number
}

/**
 * Options for creating NFTs
 */
export type NFTOptions = {
  algod: Algodv2
  creatorAccount: Account
  dappName?: string
  additionalRounds?: number
  enforcerAppID?: number
  nfts: NewNFT[]
  reference?: string
}

/**
 * Create transactions to create NFTs according to the ARC-3 and (optionally) ARC-18 specs. May create up to 16 NFTs at a time.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0018.md
 * @param options Options for creating NFTs
 * @param options.algod Initialized Algodv2 client to get suggested params
 * @param options.creatorAccount The account that will create the NFTs
 * @param options.dappName Optional dApp name to use for the txn notes
 * @param options.additionalRounds Optional additional rounds these transactions are valid for
 * @param options.enforcerAppID Optional app ID of the enforcer app to set as manager, freeze, etc
 * @param options.nfts The NFTs to create
 * @param options.reference Optional reference to include in the txn notes
 * @returns Signed transactions to be submitted to the network
 */
export async function createNewNFTsTransactions({
  algod,
  creatorAccount,
  nfts,
  enforcerAppID,
  reference,
  additionalRounds = DEFAULT_ADDITIONAL_ROUNDS,
  dappName = DEFAULT_DAPP_NAME,
}: NFTOptions): Promise<TransactionList> {
  const {
    makeAssetCreateTxnWithSuggestedParamsFromObject,
    AtomicTransactionComposer,
    makeBasicAccountTransactionSigner,
    getApplicationAddress,
  } = await loadSDK()
  const creatorSigner = makeBasicAccountTransactionSigner(creatorAccount)
  const suggestedParams = await algod.getTransactionParams().do()
  suggestedParams.lastRound += additionalRounds
  const targetAddress = enforcerAppID
    ? getApplicationAddress(enforcerAppID)
    : creatorAccount.addr

  invariant(nfts.length > 0, 'No NFTs provided')
  invariant(
    nfts.length <= MAX_NFT_COUNT,
    `Cannot create more than ${MAX_NFT_COUNT} NFTs at once`
  )

  const atc = new AtomicTransactionComposer()

  for (const nft of nfts) {
    atc.addTransaction({
      signer: creatorSigner,
      txn: makeAssetCreateTxnWithSuggestedParamsFromObject({
        assetMetadataHash: nft.assetMetadataHash,
        assetName: nft.assetName,
        assetURL: nft.assetURL,
        clawback: targetAddress,
        decimals: 0,
        defaultFrozen: true,
        freeze: targetAddress,
        from: creatorAccount.addr,
        manager: targetAddress,
        note: encodeNote(dappName, {
          t: NoteTypes.NonFungibleTokenCreate,
          e: nft.edition,
          n: nft.totalEditions,
          r: reference,
          s: ['arc2', 'arc3'].concat(enforcerAppID ? ['arc18'] : []),
        }),
        // TODO: should this be used for something else?
        reserve: targetAddress,
        suggestedParams,
        total: 1,
        unitName: nft.unitName,
      }),
    })
  }

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

/**
 * Options for clawback transaction
 */
export type ClawbackNFTOptions = {
  algod: Algodv2
  additionalRounds?: number
  dappName?: string
  currentOwnerAddress: string
  recipientAccount?: Account
  clawbackAccount: Account
  fundingAccount?: Account
  recipientAddress: string
  assetIndex: number
  reference?: string
  skipOptIn?: boolean
}

/**
 * Trigger a clawback transfer of an NFT to a custodial account.
 * @param options Options for the clawback transfer
 * @param options.additionalRounds Optional additional rounds these transactions are valid for
 * @param options.algod Initialized Algodv2 client
 * @param options.assetIndex Index of the asset to clawback
 * @param options.clawbackAccount Account that is set as the clawback on the NFT
 * @param options.currentOwnerAddress Address of the current owner of the NFT
 * @param options.dappName Optional name of the dApp
 * @param options.fundingAccount Optional account that can fund the NFT opt-in
 * @param options.recipientAccount Optional account that needs to opt-in to the NFT
 * @param options.recipientAddress Address of the recipient of the NFT
 * @param options.reference Optional reference for the clawback
 * @param options.skipOptIn Optional flag to skip the opt-in process
 * @returns Signed transactions to be submitted to the network
 */
export async function createClawbackNFTTransactions({
  additionalRounds = DEFAULT_ADDITIONAL_ROUNDS,
  algod,
  assetIndex,
  clawbackAccount,
  currentOwnerAddress,
  dappName = DEFAULT_DAPP_NAME,
  fundingAccount,
  recipientAccount,
  recipientAddress,
  reference,
  skipOptIn,
}: ClawbackNFTOptions): Promise<TransactionList> {
  const {
    makeBasicAccountTransactionSigner,
    makePaymentTxnWithSuggestedParamsFromObject,
    makeAssetTransferTxnWithSuggestedParamsFromObject,
    AtomicTransactionComposer,
  } = await loadSDK()
  const suggestedParams = await algod.getTransactionParams().do()
  suggestedParams.lastRound += additionalRounds

  const clawbackSigner = makeBasicAccountTransactionSigner(clawbackAccount)
  const atc = new AtomicTransactionComposer()

  if (!skipOptIn) {
    invariant(
      fundingAccount && recipientAccount,
      'Must provide funding and recipient accounts while opting in to NFT'
    )

    // Send enough money to recipient to cover the "opt-in" transaction and the minimum balance increase
    const fundingSigner = makeBasicAccountTransactionSigner(fundingAccount)
    atc.addTransaction({
      signer: fundingSigner,
      txn: makePaymentTxnWithSuggestedParamsFromObject({
        suggestedParams,
        amount:
          100_000 /* minimum balance increase */ + 1000 /* opt-in txn fee */,
        from: fundingAccount.addr,
        to: recipientAccount.addr,
        note: encodeNote(dappName, {
          t: NoteTypes.ClawbackTransferPayFunds,
          r: reference,
          a: assetIndex,
          s: ['arc2'],
        }),
      }),
    })

    // Recipient needs to "opt-in" to the asset by using a "zero-balance" transaction
    const recipientSigner = makeBasicAccountTransactionSigner(recipientAccount)
    atc.addTransaction({
      signer: recipientSigner,
      txn: makeAssetTransferTxnWithSuggestedParamsFromObject({
        suggestedParams,
        amount: 0,
        assetIndex,
        from: recipientAccount.addr,
        to: recipientAccount.addr,
        note: encodeNote(dappName, {
          t: NoteTypes.ClawbackTransferOptIn,
          r: reference,
          s: ['arc2'],
        }),
      }),
    })
  }

  // Use a clawback to "revoke" ownership from current owner to the recipient.
  atc.addTransaction({
    signer: clawbackSigner,
    txn: makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams,
      amount: 1,
      assetIndex,
      // Who is issuing the transaction
      from: clawbackAccount.addr,
      to: recipientAddress,
      // Who the asset is being revoked from
      revocationTarget: currentOwnerAddress,
      note: encodeNote(dappName, {
        t: NoteTypes.ClawbackTransferTxn,
        r: reference,
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
