import { logger } from '@api/configuration/logger'
import TransactionsService from '@api/modules/transactions/transactions.service'
import DependencyResolver from '@api/shared/configure-resolver'
import { Model } from 'objection'

export default async function confirmTransactionsTask(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'confirm-transactions' })
  const transactions = registry.get<TransactionsService>(
    TransactionsService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await transactions.confirmPendingTransactions(undefined, trx)
    await trx.commit()
    log.info(result, 'updated transactions')
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to update transactions')
  }
}
