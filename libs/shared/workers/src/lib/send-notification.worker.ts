import {
  SendNotificationData,
  SendNotificationQueueName,
} from '@algomart/shared/queues'
import { NotificationsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class SendNotificationWorker extends BaseWorker<SendNotificationData> {
  constructor(
    connection: Redis,
    private readonly notificationsService: NotificationsService
  ) {
    super(SendNotificationQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(job: Job<SendNotificationData, void, string>): Promise<void> {
    await this.notificationsService.dispatchNotificationById(
      job.data.notificationId
    )
  }

  static create(container: DependencyResolver): SendNotificationWorker {
    return new SendNotificationWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<NotificationsService>(NotificationsService.name)
    )
  }
}
