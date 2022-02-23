import { PaymentsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { Knex } from 'knex'
import { Model } from 'objection'
import pino from 'pino'

export async function updatePaymentStatusesTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>,
  knexRead?: Knex
) {
  const log = logger.child({ task: 'update-payment-statuses' })
  const payments = registry.get<PaymentsService>(PaymentsService.name)
  const trx = await Model.startTransaction()

  try {
    const updatedPayments = await payments.updatePaymentStatuses(
      Configuration.customerServiceEmail,
      trx,
      knexRead
    )
    log.info('updated %d payment statuses', updatedPayments)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to update payment statuses')
  }
}
