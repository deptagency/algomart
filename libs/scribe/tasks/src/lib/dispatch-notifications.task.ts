import { NotificationsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Model } from 'objection'
import pino from 'pino'

export async function dispatchNotificationsTask(
  registry: DependencyResolver,
  logger: pino.Logger<unknown>
) {
  const log = logger.child({ task: 'dispatch-notifications' })
  const notifications = registry.get<NotificationsService>(
    NotificationsService.name
  )

  const trx = await Model.startTransaction()
  try {
    await notifications.dispatchNotifications(trx)
    await trx.commit()
  } catch (error) {
    await trx.rollback()
    log.error(error as Error, 'failed to dispatch notifications')
  }
}
