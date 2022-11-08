import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type SendNotificationData = {
  notificationId: string
}

export const SendNotificationQueueName = 'send-notification'

export class SendNotificationQueue extends BaseQueue<SendNotificationData> {
  constructor(connection: Redis) {
    super(SendNotificationQueueName, connection)
  }

  async enqueue(data: SendNotificationData): Promise<void> {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): SendNotificationQueue {
    return new SendNotificationQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
