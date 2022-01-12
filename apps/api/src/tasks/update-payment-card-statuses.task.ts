import { Model } from 'objection'

import PaymentsService from '@/modules/payments/payments.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

export async function updatePaymentCardStatusesTask(
  registry: DependencyResolver
) {
  const log = logger.child({ task: 'update-payment-card-statuses' })
  const payments = registry.get<PaymentsService>(PaymentsService.name)
  const trx = await Model.startTransaction()
  try {
    const updatedCards = await payments.updatePaymentCardStatuses(trx)
    log.info('updated %d payment card statuses', updatedCards)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to update payment card statuses')
  }
}
