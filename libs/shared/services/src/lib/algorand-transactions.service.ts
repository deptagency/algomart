import { AlgorandTransactionStatus } from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  encodeRawSignedTransaction,
  isAlreadyInLedgerError,
} from '@algomart/shared/algorand'
import {
  AlgorandAccountModel,
  AlgorandTransactionGroupModel,
  AlgorandTransactionModel,
  CollectibleModel,
} from '@algomart/shared/models'
import { invariant } from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { Model, raw, Transaction } from 'objection'

export class AlgorandTransactionsService {
  constructor(private readonly algorand: AlgorandAdapter) {}

  /**
   * Save signed transactions as a group. Optionally provide a DB transaction
   * if needed. Assumes the signedTransactions and transactionIds are in the
   * same order and of the same length.
   * @param signedTransactions Signed transactions to save
   * @param transactionIds Matching transaction IDs
   * @param trx Optional DB transaction
   * @returns The saved transactions and the transaction groups
   */
  async saveSignedTransactions(
    signedTransactions: Uint8Array[],
    transactionIds: string[],
    trx?: Transaction
  ) {
    const innerTrx = trx ?? (await Model.startTransaction())

    try {
      const group = await AlgorandTransactionGroupModel.query(innerTrx).insert(
        {}
      )

      const transactions = await AlgorandTransactionModel.query(
        innerTrx
      ).insert(
        transactionIds.map((id, index) => ({
          address: id,
          status: AlgorandTransactionStatus.Signed,
          groupId: group.id,
          encodedSignedTransaction: encodeRawSignedTransaction(
            signedTransactions[index]
          ),
          order: index,
        }))
      )

      if (!trx) await innerTrx.commit()

      return { transactions, group }
    } catch (error) {
      if (!trx) await innerTrx.rollback()
      throw error
    }
  }

  // Given an atomic transaction group, wait for all transactions to confirm or fail.
  // Submit them or re-submit them if necessary.
  //
  // If a transaction fails, or if anything else goes wrong, this function throws
  // after recording the FAILED status so that the parent process can be restarted
  //
  //
  // Note: if a job sits in "Failed" for a while (over an hour) and is later retried manually,
  // We may get an error on submit like: "TransactionPool.Remember: txn dead". This means that the
  // transaction is too old. This function will mark the transactions as failed and throw an error.
  // The calling function can catch this error and clear/ regenerate the Algorand transactions if it
  // wants to
  async submitAndWaitForTransactionsIfNecessary(
    signedTransactions: Uint8Array[],
    transactionIds: string[]
  ) {
    try {
      const lastKnownTransactionStatus =
        await this.getRecordedTransactionStatus(transactionIds[0])

      invariant(
        !!lastKnownTransactionStatus,
        'Unable to lookup transaction status',
        UnrecoverableError
      )

      if (lastKnownTransactionStatus === AlgorandTransactionStatus.Confirmed) {
        // if the last known status is Confirmed, then no-op
        return
      }
      if (lastKnownTransactionStatus === AlgorandTransactionStatus.Pending) {
        // (this function will throw an error if Algorand reports a transaction as failed)
        await this.waitOnAllTransactionsAndMarkConfirmed(transactionIds)
      } else {
        // the transaction has either not been submitted or is believed to have failed, so
        // we should re-submit
        try {
          await this.algorand.submitTransaction(signedTransactions)
        } catch (error) {
          if (isAlreadyInLedgerError(error)) {
            // if the submission fails because it's in the ledger already then mark as confirmed
            await this.markTransactionStatuses(
              transactionIds,
              AlgorandTransactionStatus.Confirmed
            )
            return
          }
          // otherwise, unsure what went wrong
          // TODO: identify other error types and determine if a retry or no-op is warranted
          throw error
        }
        await this.markTransactionStatuses(
          transactionIds,
          AlgorandTransactionStatus.Pending
        )
        await this.waitOnAllTransactionsAndMarkConfirmed(transactionIds)
      }
    } catch (error) {
      // Catch all errors and mark the transactions as failed.
      // If algorand reported an error when checking a status, it will be in error.message
      // but this also catches any other miscellaneous errors that might've happened
      //
      // (so maybe its a little "incorrect" to mark the transactions as failed because we
      // aren't really sure if they failed or not, but the implication regardless is that the
      // process should be stopped and picked up again from the beginning.)
      await this.markTransactionStatuses(
        transactionIds,
        AlgorandTransactionStatus.Failed,
        error.message
      )
      throw error
    }
  }

  async markTransactionStatuses(
    transactionIds: string[],
    status: AlgorandTransactionStatus,
    error: string = null
  ) {
    const fields = {
      status,
      error,
    }

    await AlgorandTransactionModel.query()
      .patch(fields)
      .whereIn('address', transactionIds)
  }

  async clearCreationTransactionIdFromAlgorandAccount(
    algorandAccountId: string
  ) {
    await AlgorandAccountModel.query()
      .where({
        id: algorandAccountId,
      })
      .patch({
        // the model property is types as nullable, but for some reason objection still yells that
        // it must be a string if we don't wrap with raw()
        creationTransactionId: raw('null'),
      })
  }

  async clearCreationTransactionIdFromCollectibles(
    collectibles: CollectibleModel[]
  ) {
    const collectibleIds = collectibles.map((collectible) => collectible.id)
    await CollectibleModel.query()
      .whereIn('id', collectibleIds)
      .patch({
        // the model property is types as nullable, but for some reason objection still yells that
        // it must be a string if we don't wrap with raw()
        creationTransactionId: raw('null'),
      })
  }

  async clearLatestTransferTransactionIdFromCollectible(collectibleId: string) {
    await CollectibleModel.query()
      .where('id', collectibleId)
      .patch({
        // the model property is types as nullable, but for some reason objection still yells that
        // it must be a string if we don't wrap with raw()
        latestTransferTransactionId: raw('null'),
      })
  }

  // Note: this will fail if there's rows that reference these transactions, so
  // make sure you clear FK's first
  async deleteTransactionGroup(groupId: string) {
    const trx = await Model.startTransaction()
    try {
      await AlgorandTransactionModel.query(trx)
        .where('groupId', groupId)
        .delete()
      await AlgorandTransactionGroupModel.query(trx).deleteById(groupId)
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async getRecordedTransactionStatus(transactionId: string) {
    return await AlgorandTransactionModel.query()
      .select('status')
      .where('address', transactionId)
      .then((rows) => rows[0]?.status)
  }

  async waitOnAllTransactionsAndMarkConfirmed(transactionIds: string[]) {
    // if it was pending the last we heard, then wait / check statuses
    const statuses = await this.algorand.waitForAllConfirmations(transactionIds)

    // if any of the transactions in the group have an error, mark all as failed
    // note: we mark them all with the same error (the first one we find). Unsure if
    // this is totally "correct" or not.
    const errorMessage = statuses.find(
      (status) => !!status.poolError
    )?.poolError
    if (errorMessage) {
      throw new Error(errorMessage)
    } else {
      const allConfirmed = statuses.every((status) => status.confirmedRound)
      if (allConfirmed) {
        await this.markTransactionStatuses(
          transactionIds,
          AlgorandTransactionStatus.Confirmed
        )
      } else {
        throw new Error('Some transactions have not been confirmed')
      }
    }
  }
}
