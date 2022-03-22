import { logger } from '@api/configuration/logger'
import PaymentsService from '@api/modules/payments/payments.service'
import DependencyResolver from '@api/shared/configure-resolver'
import { Model } from 'objection'

export async function updatePaymentStatusesTask(registry: DependencyResolver) {
  const log = logger.child({ task: 'update-payment-statuses' })
  const payments = registry.get<PaymentsService>(PaymentsService.name)
  const trx = await Model.startTransaction()
  try {
    const updatedPayments = await payments.updatePaymentStatuses(trx)
    log.info('updated %d payment statuses', updatedPayments)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to update payment statuses')
  }
}
