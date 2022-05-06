import {
  AlgorandTransactionStatus,
  EventAction,
  EventEntityType,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import { decodeRawSignedTransaction } from '@algomart/shared/algorand'
import {
  AlgorandTransactionModel,
  CollectibleModel,
  EventModel,
} from '@algomart/shared/models'
import { Transaction } from 'objection'
import pino from 'pino'

export class TransactionsService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly algorand: AlgorandAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  async submitSignedTransactions(trx?: Transaction): Promise<number> {
    let isGroup = false
    // Grab a single transaction (the oldest one)
    let transactions = await AlgorandTransactionModel.query(trx)
      .where('status', AlgorandTransactionStatus.Signed)
      .select('id', 'address', 'groupId', 'encodedSignedTransaction')
      .orderBy('createdAt', 'ASC')
      .limit(1)

    if (transactions.length === 0) {
      return 0
    }

    if (transactions[0].groupId) {
      // This transaction is part of a group, must submit them all together
      // Since it's a group, use the `order` column to sort them
      isGroup = true
      transactions = await AlgorandTransactionModel.query(trx)
        .where('groupId', transactions[0].groupId)
        .orderBy('order', 'ASC')
        .select('id', 'address', 'groupId', 'encodedSignedTransaction')
    }

    if (!transactions.every((t) => !!t.encodedSignedTransaction)) {
      // Missing one or more encoded signed transactions, can't submit
      await AlgorandTransactionModel.query(trx)
        .where('groupId', transactions[0].groupId)
        .patch({
          error: 'Missing signed transaction',
          status: AlgorandTransactionStatus.Failed,
        })
      return 0
    }

    const signedTransactions = transactions.map((t) =>
      decodeRawSignedTransaction(t.encodedSignedTransaction)
    )

    const baseQuery = isGroup
      ? AlgorandTransactionModel.query(trx).where(
          'groupId',
          transactions[0].groupId
        )
      : AlgorandTransactionModel.query(trx).where('id', transactions[0].id)

    try {
      await this.algorand.submitTransaction(signedTransactions)
    } catch (error) {
      this.logger.error(error)
      await baseQuery.patch({
        error: error.message,
        status: AlgorandTransactionStatus.Failed,
      })
      return 0
    }

    await baseQuery.patch({
      status: AlgorandTransactionStatus.Pending,
    })

    await EventModel.query(trx).insert(
      transactions.map((t) => ({
        action: EventAction.Update,
        entityId: t.id,
        entityType: EventEntityType.AlgorandTransaction,
      }))
    )

    return transactions.length
  }

  async confirmPendingTransactions(limit = 16, trx?: Transaction) {
    const transactions = await AlgorandTransactionModel.query(trx)
      .where('status', AlgorandTransactionStatus.Pending)
      .select('id', 'address')
      .limit(limit)

    const counts = {
      confirmed: 0,
      failed: 0,
      pending: 0,
    }

    if (transactions.length === 0) {
      return counts
    }

    for (const transaction of transactions) {
      const result = await this.algorand.getTransactionStatus(
        transaction.address
      )

      let status = AlgorandTransactionStatus.Pending
      let error: string | null = null
      let updateCollectible = false

      if (result.confirmedRound > 0) {
        // Confirmed
        counts.confirmed += 1
        status = AlgorandTransactionStatus.Confirmed

        if (result.assetIndex > 0) {
          // Created asset, need to update collectible
          updateCollectible = true
        }
      } else if (result.poolError) {
        // Failed
        counts.failed += 1
        status = AlgorandTransactionStatus.Failed
        error = result.poolError
      } else {
        // Still pending, no updates needed
        counts.pending += 1
        continue
      }

      await AlgorandTransactionModel.query(trx)
        .patch({
          status,
          error,
        })
        .where('id', transaction.id)

      await EventModel.query(trx).insert({
        action: EventAction.Update,
        entityId: transaction.id,
        entityType: EventEntityType.AlgorandTransaction,
      })

      if (updateCollectible) {
        const collectible = await CollectibleModel.query(trx)
          .where('creationTransactionId', transaction.id)
          .first()

        if (collectible) {
          await CollectibleModel.query(trx)
            .patch({
              address: result.assetIndex,
            })
            .where('id', collectible.id)

          await EventModel.query(trx).insert({
            action: EventAction.Update,
            entityId: collectible.id,
            entityType: EventEntityType.Collectible,
          })
        }
      }
    }

    return counts
  }
}
