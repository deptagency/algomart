import {
  AlgorandAccountSig,
  AlgorandAccountStatus,
  AlgorandAssetHolding,
  AlgorandTransformedAccountInfo,
} from '@algomart/schemas'
import type { Account, Algodv2, Indexer } from 'algosdk'

import {
  DEFAULT_ADDITIONAL_ROUNDS,
  DEFAULT_DAPP_NAME,
  DEFAULT_INITIAL_BALANCE,
} from './constants'
import { encodeNote, NoteTypes } from './note'
import { loadSDK, TransactionList } from './utils'

/**
 * Lazy version of generating an Algorand account
 * @returns New Algorand account
 */
export async function generateAccount(): Promise<Account> {
  const { generateAccount } = await loadSDK()
  return generateAccount()
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
 * @param secretOrCallback Either a secret for encryption to use built in encryption, or a
 * function which returns a promise that resolves to the encrypted mnemonic to use custom encryption
 * @returns Encrypted mnemonic as a string
 */
export async function encryptAccount(
  account: Account,
  secretOrCallback?: ((mnemonic) => Promise<string>) | string
): Promise<string> {
  const { secretKeyToMnemonic } = await loadSDK()
  const mnemonic = secretKeyToMnemonic(account.sk)
  let encrypted
  if (typeof secretOrCallback === 'string') {
    const secret: string = secretOrCallback
    const { encrypt } = await import('@algomart/shared/utils')
    encrypted = encrypt(mnemonic, secret)
  } else {
    const callback: (mnemonic) => Promise<string> = secretOrCallback as (
      mnemonic
    ) => Promise<string>
    encrypted = await callback(mnemonic)
  }

  return encrypted
}

/**
 * Decrypts an account from an encrypted mnemonic
 * @param encrypted Encrypted mnemonic
 * @param callback Optional function which returns a promise that resolves
 * to the encrypted mnemonic to use custom encryption
 * @param secret Optional app secret to use the default encryption. If both secret
 * and callback are provided, default decryption will run first and custom decryption
 * will run after that if default decryption fails
 * @returns The decrypted account
 */
export async function decryptAccount(
  encrypted: string,
  secret?: string,
  callback?: (encrypted) => Promise<string>
): Promise<Account> {
  const { mnemonicToSecretKey } = await loadSDK()
  let decrypted
  if (secret) {
    const { decrypt } = await import('@algomart/shared/utils')
    // returns zero length string if decryption fails
    decrypted = decrypt(encrypted, secret)
  }
  if (!decrypted && callback) {
    decrypted = await callback(encrypted)
  }
  if (!decrypted) {
    const errorMessage = `Unable to decrypt account. Tried default decryption${
      callback ? ' and custom decryption' : ''
    }.`
    throw new Error(errorMessage)
  }
  return mnemonicToSecretKey(decrypted)
}
/**
 * Transforms account info from algod.accountInformation into a better typed object.
 * @param info The account info to transform
 * @returns A better typed version of the account info
 */
export function transformAccountInfo(
  info: Record<string, unknown>
): AlgorandTransformedAccountInfo {
  return {
    address: info['address'] as string,
    amount: info['amount'] as number,
    amountWithoutPendingRewards: info[
      'amount-without-pending-rewards'
    ] as number,
    appsLocalState: info['apps-local-state'] as Record<string, unknown>[],
    appsTotalExtraPages: info['apps-total-extra-pages'] as number,
    appsTotalSchema: info['apps-total-schema'] as Record<string, unknown>,
    assets: (info['assets'] as Record<string, unknown>[])?.map(
      (asset): AlgorandAssetHolding => ({
        assetIndex: asset['asset-id'] as number,
        amount: asset['amount'] as number,
        isFrozen: asset['is-frozen'] as boolean,
      })
    ),
    authAddr: info['auth-addr'] as string,
    createdApps: info['created-apps'] as Record<string, unknown>[],
    createdAssets: info['created-assets'] as Record<string, unknown>[],
    participation: info['participation'] as Record<string, unknown>,
    pendingRewards: info['pending-rewards'] as number,
    rewardBase: info['reward-base'] as number,
    rewards: info['rewards'] as number,
    round: info['round'] as number,
    sigType: info['sig-type'] as AlgorandAccountSig,
    status: info['status'] as AlgorandAccountStatus,
    totalAppsOptedIn: info['total-apps-opted-in'] as number,
    totalAssetsOptedIn: info['total-assets-opted-in'] as number,
    totalCreatedApps: info['total-created-apps'] as number,
    totalCreatedAssets: info['total-created-assets'] as number,
  }
}

/**
 * Get transformed account info by address via Indexer.
 * @param indexer Initialized Indexer client
 * @param address Account address
 * @returns Transformed account info
 */
export async function lookupAccount(
  indexer: Indexer,
  address: string
): Promise<AlgorandTransformedAccountInfo | null> {
  try {
    const info = await indexer.lookupAccountByID(address).do()
    return transformAccountInfo(info['account'])
  } catch {
    return null
  }
}
