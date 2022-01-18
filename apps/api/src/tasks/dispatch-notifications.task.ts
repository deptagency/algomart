import { Model } from 'objection'

import NotificationsService from '@/modules/notifications/notifications.service'
import DependencyResolver from '@/shared/dependency-resolver'
import { logger } from '@/utils/logger'

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
