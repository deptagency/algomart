import { TransactionsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Model } from 'objection'
import pino from 'pino'

export async function submitTransactionsTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>
) {
  const log = logger.child({ task: 'submit-transactions' })
  const transactions = registry.get<TransactionsService>(
    TransactionsService.name
  )
  const trx = await Model.startTransaction()
  try {
    const result = await transactions.submitSignedTransactions(trx)
    await trx.commit()
    log.info(result, 'submitted transactions')
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to submit transactions')
  }
}
