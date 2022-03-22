import pino from 'pino'
import {
  AlgorandTransactionStatus,
  EventAction,
  EventEntityType,
} from '@algomart/schemas'
import { AlgorandAdapter } from '@algomart/shared/adapters'
import {
  AlgorandTransactionModel,
  CollectibleModel,
  EventModel,
} from '@algomart/shared/models'
import { Transaction } from 'objection'

export class TransactionsService {
  logger: pino.Logger<unknown>
  constructor(
    private readonly algorand: AlgorandAdapter,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
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
