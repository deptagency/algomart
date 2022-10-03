import { invariant } from '@algomart/shared/utils'
import type { Account, Algodv2, Indexer, Transaction } from 'algosdk'

import { lookupAccount } from './account'
import {
  DEFAULT_ADDITIONAL_ROUNDS,
  DEFAULT_DAPP_NAME,
  MAX_NFT_COUNT,
} from './constants'
import { encodeNote, NoteTypes } from './note'
import { loadSDK, TransactionList } from './utils'
import { encodeTransaction, WalletTransaction } from './wallet'

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
  additionalRounds?: number
  algod: Algodv2
  creatorAccount: Account
  dappName?: string
  enforcerAppID?: number
  overrideManager?: string
  overrideClawback?: string
  overrideFreeze?: string
  overrideReserve?: string
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
  enforcerAppID,
  nfts,
  overrideClawback,
  overrideFreeze,
  overrideManager,
  overrideReserve,
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
        clawback: overrideClawback ?? targetAddress,
        decimals: 0,
        defaultFrozen: true,
        freeze: overrideFreeze ?? targetAddress,
        from: creatorAccount.addr,
        manager: overrideManager ?? targetAddress,
        note: encodeNote(dappName, {
          t: NoteTypes.NonFungibleTokenCreate,
          e: nft.edition,
          n: nft.totalEditions,
          r: reference,
          s: ['arc2', 'arc3', ...(enforcerAppID ? ['arc18', 'arc20'] : [])],
        }),
        // TODO: should this be used for something else?
        reserve: overrideReserve ?? targetAddress,
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

/**
 * Metadata structure for ARC3 specification
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md#json-metadata-file-schema
 */
export type ARC3Metadata = {
  animation_url_integrity?: string
  animation_url_mimetype?: string
  animation_url?: string
  background_color?: string
  decimals?: number
  description?: string
  external_url_integrity?: string
  external_url_mimetype?: string
  external_url?: string
  image_integrity?: string
  image_mimetype?: string
  image?: string
  name?: string
  properties?: Record<string, unknown>
  extra_metadata?: string
  localization?: {
    uri: string
    default: string
    locales: string[]
    integrity?: Record<string, string>
  }
}

/**
 * Helper class to build a metadata structure compliant with ARC3 using a fluent API.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md#json-metadata-file-schema
 */
class MetadataBuilder {
  private _metadata: ARC3Metadata = {}

  build(): ARC3Metadata {
    return Object.freeze(Object.assign({}, this._metadata))
  }

  toJSON(): string {
    return JSON.stringify(this.build())
  }

  /**
   * Set animation URL fields.
   * @param url URL to the animation
   * @param mimetype Animation content type
   * @param integrity Animation integrity hash (SHA256)
   * @returns The builder
   */
  animation(url: string, mimetype?: string, integrity?: string) {
    this._metadata.animation_url = url
    this._metadata.animation_url_mimetype = mimetype
    this._metadata.animation_url_integrity = integrity
    return this
  }

  /**
   * Sets the decimals field.
   * @param decimals Number of decimals
   * @returns The builder
   */
  decimals(decimals: number) {
    this._metadata.decimals = decimals
    return this
  }

  /**
   * Sets the name field.
   * @param name Name of the NFT.
   * @returns The builder
   */
  name(name: string) {
    this._metadata.name = name
    return this
  }

  /**
   * Sets the description field.
   * @param description Description of the NFT.
   * @returns The builder
   */
  description(description: string) {
    this._metadata.description = description
    return this
  }

  /**
   * Sets the image fields.
   * @param url URL to the image
   * @param mimetype Image content type
   * @param integrity Image integrity hash (SHA256)
   * @returns The builder
   */
  image(url: string, mimetype?: string, integrity?: string) {
    this._metadata.image = url
    this._metadata.image_mimetype = mimetype
    this._metadata.image_integrity = integrity
    return this
  }

  /**
   * Sets the background color field.
   * @param color Hex color code
   * @returns The builder
   */
  backgroundColor(color: string) {
    this._metadata.background_color = color
    return this
  }

  /**
   * Sets the external URL fields.
   * @param url URL to the external resource
   * @param mimetype Content type of the external resource
   * @param integrity Integrity hash of the external resource (SHA256)
   * @returns The builder
   */
  external(url: string, mimetype?: string, integrity?: string) {
    this._metadata.external_url = url
    this._metadata.external_url_mimetype = mimetype
    this._metadata.external_url_integrity = integrity
    return this
  }

  /**
   * Sets a property on the properties field.
   * @param key Property key
   * @param value Property value
   * @returns The builder
   */
  property(key: string, value: unknown) {
    this._metadata.properties = this._metadata.properties || {}
    this._metadata.properties[key] = value
    return this
  }

  /**
   * Sets all properties on the properties field. Overrides any existing properties.
   * @param properties Properties to set
   * @returns The builder
   */
  properties(properties: Record<string, unknown>) {
    this._metadata.properties = properties
    return this
  }

  /**
   * Sets the extra metadata field.
   * @param extraMetadata Extra metadata to include, base64 encoded
   * @returns The builder
   */
  extraMetadata(extraMetadata: string) {
    this._metadata.extra_metadata = extraMetadata
    return this
  }

  /**
   * Sets the localization fields.
   * @param uri URI to the localization file
   * @param defaultLocale Default locale used in this metadata JSON file
   * @param locales All available locales
   * @param integrity Integrity object with hashes for each localized metadata file
   * @returns The builder
   */
  localization(
    uri: string,
    defaultLocale: string,
    locales: string[],
    integrity?: Record<string, string>
  ) {
    this._metadata.localization = {
      uri,
      default: defaultLocale,
      locales,
      integrity,
    }
    return this
  }
}

/**
 * Create a new MetadataBuilder instance to create ARC3 compliant metadata.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md#json-metadata-file-schema
 * @returns A builder to construct ARC3 compliant metadata
 */
export function buildMetadata() {
  return new MetadataBuilder()
}

export type ExportNFTOptions = {
  additionalRounds?: number
  algod: Algodv2
  assetIndex: number
  clawbackAddress: string
  dappName?: string
  fromAddress: string
  fundingAddress: string
  reference?: string
  toAddress: string
}

/**
 * Creates NFT export transactions for the given asset index.
 * @note This should not be used once the Enforcer contract is implemented.
 * @param options Options for the export
 * @param options.additionalRounds Optional additional rounds these transactions are valid for
 * @param options.algod Initialized Algodv2 client
 * @param options.assetIndex Index of the asset to export
 * @param options.clawbackAddress Address that can perform clawback on the NFT
 * @param options.dappName Optional name of the dapp
 * @param options.fromAddress Address of the current NFT holder
 * @param options.fundingAddress Address to fund the transactions
 * @param options.reference Optional reference for the transaction
 * @param options.toAddress Address to transfer the NFT to
 * @returns Encoded unsigned transactions
 */
export async function createExportNFTTransactions({
  additionalRounds = DEFAULT_ADDITIONAL_ROUNDS,
  algod,
  assetIndex,
  clawbackAddress,
  dappName = DEFAULT_DAPP_NAME,
  fromAddress,
  fundingAddress,
  reference,
  toAddress,
}: ExportNFTOptions): Promise<WalletTransaction[]> {
  const {
    makePaymentTxnWithSuggestedParamsFromObject,
    makeAssetTransferTxnWithSuggestedParamsFromObject,
    assignGroupID,
  } = await loadSDK()
  const suggestedParams = await algod.getTransactionParams().do()
  suggestedParams.lastRound += additionalRounds

  // Send funds to cover asset transfer transaction
  // Signed by funding account
  const fundsTxn = makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 2000,
    from: fundingAddress,
    to: fromAddress,
    note: encodeNote(dappName, {
      t: NoteTypes.ExportTransferPayFunds,
      r: reference,
      s: ['arc2'],
    }),
  })

  // Opt-in to asset in recipient's non-custodial wallet
  // Signed by non-custodial wallet recipient
  const optInTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 0,
    assetIndex,
    from: toAddress,
    to: toAddress,
    note: encodeNote(dappName, {
      t: NoteTypes.ExportTransferOptIn,
      r: reference,
      s: ['arc2'],
    }),
  })

  // Transfer asset to recipient and remove opt-in from sender
  // Signed by the user's custodial wallet
  const transferAssetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    assetIndex,
    from: clawbackAddress,
    to: toAddress,
    amount: 1,
    revocationTarget: fromAddress,
    note: encodeNote(dappName, {
      t: NoteTypes.ExportTransferAsset,
      r: reference,
      s: ['arc2'],
    }),
  })

  const optOutAssetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    assetIndex,
    from: fromAddress,
    to: toAddress,
    amount: 0,
    closeRemainderTo: toAddress,
    note: encodeNote(dappName, {
      t: NoteTypes.ExportTransferAsset,
      r: reference,
      s: ['arc2'],
    }),
  })

  // Return min balance funds to funding account
  // Signed by the user's custodial wallet
  const returnFundsTxn = makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    from: fromAddress,
    to: fundingAddress,
    amount: 100_000,
    note: encodeNote(dappName, {
      t: NoteTypes.ExportTransferReturnFunds,
      r: reference,
      s: ['arc2'],
    }),
  })

  const transactions = [
    fundsTxn,
    optInTxn,
    transferAssetTxn,
    optOutAssetTxn,
    returnFundsTxn,
  ]

  const signers = [
    fundingAddress,
    toAddress,
    clawbackAddress,
    fromAddress,
    fromAddress,
  ]

  assignGroupID(transactions)

  return Promise.all(
    transactions.map((txn, index) => {
      return encodeTransaction(txn, [signers[index]])
    })
  )
}

export type ImportNFTOptions = {
  additionalRounds?: number
  algod: Algodv2
  assetIndex: number
  clawbackAddress: string
  dappName?: string
  fromAddress: string
  fundingAddress: string
  indexer: Indexer
  reference?: string
  toAddress: string
}

/**
 * Create NFT import transactions for the given asset index.
 * @param options Options for the import
 * @param options.additionalRounds Optional additional rounds these transactions are valid for
 * @param options.algod Initialized Algodv2 client
 * @param options.assetIndex Index of the asset to import
 * @param options.clawbackAddress Address that can perform clawback on the NFT
 * @param options.dappName Optional name of the dapp
 * @param options.fromAddress Address of the current NFT holder
 * @param options.fundingAddress Address to fund the transactions
 * @param options.reference Optional reference for the transaction
 * @param options.toAddress Address to transfer the NFT to
 * @returns Encoded unsigned transactions
 */
export async function createImportNFTTransactions({
  algod,
  assetIndex,
  clawbackAddress,
  fromAddress,
  fundingAddress,
  indexer,
  toAddress,
  additionalRounds = DEFAULT_ADDITIONAL_ROUNDS,
  dappName = DEFAULT_DAPP_NAME,
  reference,
}: ImportNFTOptions) {
  const accountInfo = await lookupAccount(indexer, toAddress)
  const transactions: Transaction[] = []

  const {
    makePaymentTxnWithSuggestedParamsFromObject,
    makeAssetTransferTxnWithSuggestedParamsFromObject,
    assignGroupID,
  } = await loadSDK()
  const suggestedParams = await algod.getTransactionParams().do()
  suggestedParams.lastRound += additionalRounds

  const signers: string[] = []

  if (!accountInfo.assets?.some((asset) => asset.assetIndex === assetIndex)) {
    // This account has not opted in to this asset
    // 0.1 Algo for opt-in, 1000 microAlgos for txn fee
    let minBalanceIncrease = 100_000 + 1000

    if (accountInfo.amount === 0) {
      // this is a brand new account, need to send additional funds
      minBalanceIncrease += 100_000
    }

    // Send funds to cover asset min balance increase
    // Signed by the funding account
    const fundsTxn = makePaymentTxnWithSuggestedParamsFromObject({
      suggestedParams,
      amount: minBalanceIncrease,
      from: fundingAddress,
      to: toAddress,
      note: encodeNote(dappName, {
        t: NoteTypes.ImportTransferPayFunds,
        r: reference,
        s: ['arc2'],
      }),
    })

    // Opt-in to asset
    // Signed by the user's custodial account
    const optInAssetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
      suggestedParams,
      assetIndex,
      from: toAddress,
      to: toAddress,
      amount: 0,
      note: encodeNote(dappName, {
        t: NoteTypes.ImportTransferOptIn,
        r: reference,
        s: ['arc2'],
      }),
    })

    signers.push(fundingAddress, toAddress)
    transactions.push(fundsTxn, optInAssetTxn)
  }

  // Transfer asset to recipient and remove opt-in from sender
  const transferAssetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    assetIndex,
    from: clawbackAddress,
    to: toAddress,
    amount: 1,
    revocationTarget: fromAddress,
    note: encodeNote(dappName, {
      t: NoteTypes.ImportTransferAsset,
      r: reference,
      s: ['arc2'],
    }),
  })

  // Opt out of the asset
  // This transaction will be signed by the non-custodial account
  const optOutAssetTxn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    assetIndex,
    from: fromAddress,
    to: toAddress,
    amount: 0,
    closeRemainderTo: toAddress,
    note: encodeNote(dappName, {
      t: NoteTypes.ImportTransferOptOut,
      r: reference,
      s: ['arc2'],
    }),
  })

  signers.push(clawbackAddress, fromAddress)
  transactions.push(transferAssetTxn, optOutAssetTxn)

  assignGroupID(transactions)

  return Promise.all(
    transactions.map((txn, index) => {
      return encodeTransaction(txn, [signers[index]])
    })
  )
}

/**
 * Typed result of asset balances result.
 */
export interface MiniAssetBalance {
  address: string
  amount: number
  deleted?: boolean
  isFrozen: boolean
  optedInAtRound: number
  optedOutAtRound: number
}

/**
 * Get a list of asset balances.
 * @param indexer Initialized Indexer client
 * @param assetIndex Asset index to lookup
 * @param params
 * @returns A list of balances for the given asset index
 */
export async function getAssetBalances(
  indexer: Indexer,
  assetIndex: number,
  params: {
    minBalance?: number
    maxBalance?: number
    includeAll?: boolean
    limit?: number
  } = {}
): Promise<MiniAssetBalance[]> {
  const query = indexer.lookupAssetBalances(assetIndex)

  if (typeof params.minBalance === 'number') {
    query.currencyGreaterThan(params.minBalance)
  }

  if (typeof params.maxBalance === 'number') {
    query.currencyLessThan(params.maxBalance)
  }

  if (typeof params.limit === 'number') {
    query.limit(params.limit)
  }

  if (typeof params.includeAll === 'boolean') {
    query.includeAll(params.includeAll)
  }

  const { balances } = await query.do()

  return balances.map((balance: Record<string, unknown>) => ({
    address: balance.address,
    amount: balance.amount,
    deleted: balance.deleted,
    isFrozen: balance['is-frozen'],
    optedInAtRound: balance['opted-in-at-round'],
    optedOutAtRound: balance['opted-out-at-round'],
  }))
}

export interface TradeOptions {
  algod: Algodv2
  assetIndex: number
  fundingAccount: Account
  sellerAccount: Account
  buyerAccount: Account
  clawbackAccount: Account
  additionalRounds?: number
  dappName?: string
  reference?: string
}

/**
 * Trades an NFT (ASA) between two accounts using a clawback transfer.
 * @param options Options for the trade
 * @param options.algod Algod client
 * @param options.assetIndex Index of the asset to trade
 * @param options.fundingAccount Account to fund the transaction
 * @param options.sellerAccount Account to sell the asset
 * @param options.buyerAccount Account to buy the asset
 * @param options.clawbackAccount Account to clawback the asset
 * @param options.additionalRounds Additional rounds to wait for
 * @param options.dappName Dapp name to encode in the note
 * @param options.reference Reference to encode in the note
 * @returns Signed transactions to be submitted to the network
 */
export async function createTradeTransactions({
  algod,
  assetIndex,
  fundingAccount,
  sellerAccount,
  buyerAccount,
  clawbackAccount,
  additionalRounds = DEFAULT_ADDITIONAL_ROUNDS,
  dappName = DEFAULT_DAPP_NAME,
  reference,
}: TradeOptions): Promise<TransactionList> {
  const {
    makePaymentTxnWithSuggestedParamsFromObject,
    makeAssetTransferTxnWithSuggestedParamsFromObject,
    AtomicTransactionComposer,
    makeBasicAccountTransactionSigner,
  } = await loadSDK()

  const fundingSigner = makeBasicAccountTransactionSigner(fundingAccount)
  const sellerSigner = makeBasicAccountTransactionSigner(sellerAccount)
  const buyerSigner = makeBasicAccountTransactionSigner(buyerAccount)
  const clawbackSigner = makeBasicAccountTransactionSigner(clawbackAccount)

  const atc = new AtomicTransactionComposer()

  const suggestedParams = await algod.getTransactionParams().do()
  suggestedParams.lastRound += additionalRounds

  const payFunds = makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 100_000,
    from: fundingAccount.addr,
    to: buyerAccount.addr,
    note: encodeNote(dappName, {
      t: NoteTypes.TradeTransferPayFunds,
      r: reference,
      s: ['arc2'],
    }),
  })
  payFunds.fee = 5000
  payFunds.flatFee = true
  atc.addTransaction({
    signer: fundingSigner,
    txn: payFunds,
  })

  const optIn = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    assetIndex,
    from: buyerAccount.addr,
    to: buyerAccount.addr,
    amount: 0,
    note: encodeNote(dappName, {
      t: NoteTypes.TradeTransferOptIn,
      r: reference,
      s: ['arc2'],
    }),
  })
  optIn.fee = 0
  optIn.flatFee = true
  atc.addTransaction({
    signer: buyerSigner,
    txn: optIn,
  })

  const transfer = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    assetIndex,
    from: clawbackAccount.addr,
    to: buyerAccount.addr,
    amount: 1,
    revocationTarget: sellerAccount.addr,
    note: encodeNote(dappName, {
      t: NoteTypes.TradeTransferAsset,
      r: reference,
      s: ['arc2'],
    }),
  })
  transfer.fee = 0
  transfer.flatFee = true
  atc.addTransaction({
    signer: clawbackSigner,
    txn: transfer,
  })

  const optOut = makeAssetTransferTxnWithSuggestedParamsFromObject({
    suggestedParams,
    assetIndex,
    from: sellerAccount.addr,
    to: buyerAccount.addr,
    closeRemainderTo: buyerAccount.addr,
    amount: 0,
    note: encodeNote(dappName, {
      t: NoteTypes.TradeTransferOptOut,
      r: reference,
      s: ['arc2'],
    }),
  })
  optOut.fee = 0
  optOut.flatFee = true
  atc.addTransaction({
    signer: sellerSigner,
    txn: optOut,
  })

  const returnFunds = makePaymentTxnWithSuggestedParamsFromObject({
    suggestedParams,
    amount: 100_000,
    from: sellerAccount.addr,
    to: fundingAccount.addr,
    note: encodeNote(dappName, {
      t: NoteTypes.TradeTransferReturnFunds,
      r: reference,
      s: ['arc2'],
    }),
  })
  returnFunds.fee = 0
  returnFunds.flatFee = true
  atc.addTransaction({
    signer: sellerSigner,
    txn: returnFunds,
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
