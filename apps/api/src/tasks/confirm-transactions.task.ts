import { TransactionsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Knex } from 'knex'
import { Model } from 'objection'

import { logger } from '../configuration/logger'

export default async function confirmTransactionsTask(
  registry: DependencyResolver,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'confirm-transactions' })
  const transactions = registry.get<TransactionsService>(
    TransactionsService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await transactions.confirmPendingTransactions(
      undefined,
      trx,
      knexRead
    )
    await trx.commit()
    log.info(result, 'updated transactions')
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to update transactions')
  }
}
