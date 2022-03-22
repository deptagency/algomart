import { logger } from '@api/configuration/logger'
import NotificationsService from '@api/modules/notifications/notifications.service'
import DependencyResolver from '@api/shared/dependency-resolver'
import { Model } from 'objection'

export default async function dispatchNotificationsTask(
  registry: DependencyResolver
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
