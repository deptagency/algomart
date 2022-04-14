import { Account, Algodv2, Transaction } from 'algosdk'

/**
 * ARC-2 pattern for dApp name
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0002.md
 */
const ARC2_DAPP_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_/@.-]{4,31}$/

/**
 * Default dApp name to use for notes etc
 */
const DEFAULT_DAPP_NAME = 'AlgoMart'

/**
 * Default number of additional rounds transactions are valid for
 */
const DEFAULT_ADDITIONAL_ROUNDS = 0

/**
 * Default initial balance for new accounts
 */
const DEFAULT_INITIAL_BALANCE = 100_000

/**
 * Max number of NFTs that can be created at once
 */
const MAX_NFT_COUNT = 16

/**
 * Note types to use for ARC-2 txn notes
 */
export enum NoteTypes {
  CustodialInitialFundPayment = 'cifp',
  CustodialInitialNonParticipation = 'cinp',
  NonFungibleTokenCreate = 'nftc',
}

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

/**
 * Lazy version of generating an Algorand account
 * @returns New Algorand account
 */
export async function generateAccount(): Promise<Account> {
  const { generateAccount } = await loadSDK()
  return generateAccount()
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
  if (!dappName.match(ARC2_DAPP_NAME_PATTERN)) {
    throw new Error(`Invalid dapp name: ${dappName}`)
  }

  const note = `${dappName}:j${JSON.stringify(noteData)}`
  return new Uint8Array(Buffer.from(note, 'utf8'))
}

export type ConfigureCustodialAccountOptions = {
  algod: Algodv2
  custodialAccount: Account
  dappName?: string
  fundingAccount: Account
  initialFunds?: number
  reference?: string
  additionalRounds?: number
}

/**
 * Create transactions to transfer initial funds to a custodial account and mark it as non-participating. Adds an additional 1000 microAlgos to the initial funds to cover keyreg txn.
 * @param options Options for configuring the custodial account
 * @param options.additionalRounds Optional additional rounds these transactions are valid for
 * @param options.algod Initialized Algodv2 client to get suggested params
 * @param options.custodialAccount The custodial account to initialize
 * @param options.dappName Optional dApp name to use for the txn notes
 * @param options.fundingAccount The funding account to transfer funds from
 * @param options.initialFunds The funds to transfer to the custodial account in microAlgos
 * @param options.reference Optional reference to include in the txn notes
 * @returns Signed transactions to be submitted to the network
 */
export async function createConfigureCustodialAccountTransactions({
  additionalRounds = DEFAULT_ADDITIONAL_ROUNDS,
  algod,
  custodialAccount,
  dappName = DEFAULT_DAPP_NAME,
  fundingAccount,
  initialFunds = DEFAULT_INITIAL_BALANCE,
  reference,
}: ConfigureCustodialAccountOptions): Promise<TransactionList> {
  const {
    makePaymentTxnWithSuggestedParamsFromObject,
    AtomicTransactionComposer,
    makeBasicAccountTransactionSigner,
    makeKeyRegistrationTxnWithSuggestedParamsFromObject,
  } = await loadSDK()
  const atc = new AtomicTransactionComposer()
  const fundingSigner = makeBasicAccountTransactionSigner(fundingAccount)
  const custodialSigner = makeBasicAccountTransactionSigner(custodialAccount)
  const suggestedParams = await algod.getTransactionParams().do()
  suggestedParams.lastRound += additionalRounds

  // Payment txn to fund the custodial account
  atc.addTransaction({
    signer: fundingSigner,
    txn: makePaymentTxnWithSuggestedParamsFromObject({
      // Add an extra 1000 microAlgos to pay for the keyreg txn
      amount: initialFunds + 1000,
      from: fundingAccount.addr,
      note: encodeNote(dappName, {
        t: NoteTypes.CustodialInitialFundPayment,
        r: reference,
        s: ['arc2'],
      }),
      suggestedParams,
      to: custodialAccount.addr,
    }),
  })

  // Opt out of participation, meaning: this account will not receive staking rewards
  atc.addTransaction({
    signer: custodialSigner,
    txn: makeKeyRegistrationTxnWithSuggestedParamsFromObject({
      from: custodialAccount.addr,
      // This triggers the opt out
      nonParticipation: true,
      note: encodeNote(dappName, {
        t: NoteTypes.CustodialInitialNonParticipation,
        r: reference,
        s: ['arc2'],
      }),
      suggestedParams,
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
 * Encrypts an account's mnemonic
 * @param account Account to encrypt
 * @param passphrase Passphrase used to encrypt the account
 * @param appSecret Global app secret
 * @returns Encrypted mnemonic as a string
 */
export async function encryptAccount(
  account: Account,
  passphrase: string,
  appSecret: string
): Promise<string> {
  const { secretKeyToMnemonic } = await loadSDK()
  const { encrypt } = await import('./encryption-utils')
  const mnemonic = secretKeyToMnemonic(account.sk)
  const encrypted = encrypt(mnemonic, passphrase, appSecret)
  return encrypted
}

/**
 * Decrypts an account from an encrypted mnemonic
 * @param encrypted Encrypted mnemonic
 * @param passphrase Passphrase to decrypt the mnemonic
 * @param appSecret Global app secret
 * @returns The decrypted account
 */
export async function decryptAccount(
  encrypted: string,
  passphrase: string,
  appSecret: string
): Promise<Account> {
  const { decrypt } = await import('./encryption-utils')
  const { mnemonicToSecretKey } = await loadSDK()
  const decrypted = decrypt(encrypted, passphrase, appSecret)
  return mnemonicToSecretKey(decrypted)
}

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
export async function createNFTTransactions({
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

  if (nfts.length > MAX_NFT_COUNT)
    throw new Error(`Cannot create more than ${MAX_NFT_COUNT} NFTs at once`)

  if (nfts.length === 0) throw new Error('No NFTs provided')

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
