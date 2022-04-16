import { invariant } from '@algomart/shared/utils'
import type { Account, Transaction, TransactionSigner } from 'algosdk'
import { loadSDK } from './utils'

export type MultisigMetadata = {
  version: number
  threshold: number
  addrs: string[]
}

/**
 * Wallet transaction type based on ARC-1.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md#interface-wallettransaction
 */
export type WalletTransaction = {
  txn: string
  signers?: string[]
  message?: string
  authAddr?: string
  msig?: MultisigMetadata
  stxn?: string
  groupMessage?: string
}

/**
 * Encodes an unsigned transaction to base64 for storage/asynchronous processing based on ARC-1.
 *
 * @note This does not support `msig` or `authAddr` at this time.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md
 * @param txn Transaction to be encoded
 * @param signers Optional signers that should sign the transaction. Leave empty to sign based on the transaction's configuration.
 * @param message Optional message to be included
 * @returns Base64 encoded transaction
 */
export async function encodeTransaction(
  txn: Transaction,
  signers?: string[],
  message?: string
): Promise<WalletTransaction> {
  const { encodeUnsignedTransaction } = await loadSDK()
  return {
    txn: Buffer.from(encodeUnsignedTransaction(txn)).toString('base64'),
    signers,
    message,
  }
}

/**
 * Encodes a list of transactions to base64 for storage/asynchronous processing based on ARC-1.
 * Also assigns group ID. Does not set `signers`, so must be set manually by the caller if needed.
 *
 * @note This does not support `msig` or `authAddr` at this time.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md
 * @param txns Transactions to encode
 * @param messages Optional messages to include, should be the same length as `txns`
 * @returns A list of encoded transactions
 */
export async function encodeTransactions(
  txns: Transaction[],
  messages?: string[]
): Promise<WalletTransaction[]> {
  const { assignGroupID } = await loadSDK()
  if (txns.length > 1) assignGroupID(txns)
  return Promise.all(
    txns.map((txn, i) => encodeTransaction(txn, undefined, messages?.[i]))
  )
}

/**
 * Encodes an unsigned transaction to base64 for storage/asynchronous processing based on ARC-1.
 * Also signs the transaction and encodes the signed transaction.
 * Be sure to use this **after** assigning the group ID, if needed.
 *
 * @note This does not support `msig` or `authAddr` at this time.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md
 * @param txn Transaction to be signed an encoded
 * @param signer The transaction signer to use
 * @param message Optional message to be included
 * @returns Base64 encoded signed transaction
 */
export async function encodeSignedTransaction(
  txn: Transaction,
  signer: TransactionSigner,
  message?: string
): Promise<WalletTransaction> {
  const { txn: txnBase64 } = await encodeTransaction(txn)
  const [signedTxn] = await signer([txn], [0])

  return {
    txn: txnBase64,
    signers: [],
    stxn: Buffer.from(signedTxn).toString('base64'),
    message,
  }
}

/**
 * Encodes a list of transactions to base64 for storage/asynchronous processing based on ARC-1.
 * Also assigns group ID and signs the transactions.
 *
 * @note This does not support `msig` or `authAddr` at this time.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md
 * @param txns Transactions to be signed and encoded
 * @param signers Signers to use, must match the length of `txns`
 * @param messages Optional messages to use, indexes must batch `txns`
 * @returns List of base64 encoded signed transactions
 */
export async function encodeSignedTransactions(
  txns: Transaction[],
  signers: TransactionSigner[],
  messages?: string[]
): Promise<WalletTransaction[]> {
  const { assignGroupID } = await loadSDK()
  if (txns.length > 1) assignGroupID(txns)
  invariant(
    txns.length === signers.length,
    'txns and signers must be the same length'
  )

  return Promise.all(
    txns.map((txn, i) =>
      encodeSignedTransaction(txn, signers[i], messages?.[i])
    )
  )
}

/**
 * Decodes an unsigned transaction from base64.
 * @param txn Encoded transaction to decode
 * @returns Decoded transaction
 */
export async function decodeTransaction(txn: string): Promise<Transaction> {
  const { decodeUnsignedTransaction } = await loadSDK()
  return decodeUnsignedTransaction(new Uint8Array(Buffer.from(txn, 'base64')))
}

enum WalletErrorCode {
  UserRejectedRequest = 4001,
  Unauthorized = 4100,
  UnsupportedOperation = 4200,
  TooManyTransactions = 4201,
  UninitializedWallet = 4202,
  InvalidInput = 4300,
}

export class WalletError extends Error {
  constructor(message: string, public code: WalletErrorCode) {
    super(message)
    this.name = 'WalletError'
  }
}

/**
 * Custom invariant for wallet errors.
 *
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md#error-standards
 * @param condition Condition to check
 * @param message Message to display if condition is false
 * @param code Wallet error code to use
 */
export function walletInvariant(
  condition: unknown,
  message: string,
  code: WalletErrorCode
): asserts condition {
  if (!condition) {
    throw new WalletError(message, code)
  }
}

/**
 * Create a function to sign encoded transactions based on ARC-1.
 *
 * @note This does not support `msig` at this time.
 * @see https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md
 * @param accounts List of accounts that are available for this session
 * @returns A function that can sign encoded transactions
 */
export async function configureSignTxns(accounts: Account[]) {
  const { isValidAddress, encodeAddress, decodeSignedTransaction } =
    await loadSDK()

  const accountLookup = new Map<string, Account>(
    accounts.map((account) => [account.addr, account])
  )

  function signTxnUsingAddress(txn: Transaction, addr: string) {
    const account = accountLookup.get(addr)
    walletInvariant(
      account,
      `signer ${addr} not found`,
      WalletErrorCode.Unauthorized
    )

    const signedTxn = txn.signTxn(account.sk)
    return Buffer.from(signedTxn).toString('base64')
  }

  async function signTxn(
    { txn, stxn, signers, msig, authAddr }: WalletTransaction,
    groupID?: Buffer
  ): Promise<string | null> {
    const decodedTransaction = await decodeTransaction(txn)

    walletInvariant(
      !groupID ||
        (decodedTransaction.group && decodedTransaction.group.equals(groupID)),
      'group mismatch',
      WalletErrorCode.InvalidInput
    )

    if (authAddr) {
      walletInvariant(
        isValidAddress(authAddr),
        'authAddr must be a valid address',
        WalletErrorCode.InvalidInput
      )
    }

    if (signers) {
      walletInvariant(
        signers.every((signer) => isValidAddress(signer)),
        'signers must be valid addresses',
        WalletErrorCode.InvalidInput
      )

      if (signers.length === 0) {
        // Should not sign this transaction
        if (stxn) {
          // Validate inner txn
          const signedTxn = decodeSignedTransaction(
            new Uint8Array(Buffer.from(stxn, 'base64'))
          )
          walletInvariant(
            signedTxn.txn.txID() === decodedTransaction.txID(),
            'Invalid inner transaction',
            WalletErrorCode.InvalidInput
          )
          return stxn
        } else {
          // Skip entirely
          return null
        }
      } else if (signers.length === 1) {
        // TODO: Support multisig
        walletInvariant(
          !msig,
          'multisig is not supported',
          WalletErrorCode.UnsupportedOperation
        )

        const signer = authAddr || signers[0]

        if (authAddr) {
          walletInvariant(
            authAddr === signers[0],
            'authAddr must match the signer',
            WalletErrorCode.InvalidInput
          )
        }

        return signTxnUsingAddress(decodedTransaction, signer)
      }

      // Should not end up here, because multiple signers implies msig must have been set
      walletInvariant(
        false,
        `badly formatted transaction ${decodedTransaction.txID()}`,
        WalletErrorCode.InvalidInput
      )
    } else {
      // No signers provided, lookup the signer specified in the transaction's `from` field
      const signer =
        authAddr || encodeAddress(decodedTransaction.from.publicKey)
      return signTxnUsingAddress(decodedTransaction, signer)
    }
  }

  return async function signTxns(
    txns: WalletTransaction[]
  ): Promise<(string | null)[]> {
    walletInvariant(
      txns.length > 0,
      'no transactions provided',
      WalletErrorCode.InvalidInput
    )
    walletInvariant(
      txns.length <= 16,
      'too many transactions',
      WalletErrorCode.TooManyTransactions
    )

    // Require that multiple transactions belong to the same group. Does not support the optional
    // specified here: https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0001.md#group-validation
    const groupID = (await decodeTransaction(txns[0].txn)).group
    walletInvariant(
      txns.length === 1 || !!groupID,
      'group must be set for multiple transactions',
      WalletErrorCode.InvalidInput
    )

    return Promise.all(txns.map((txn) => signTxn(txn, groupID)))
  }
}
