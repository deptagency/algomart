import { CircleCard } from '@algomart/schemas'
import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UpdatePaymentCardStatusData = {
  card: CircleCard
}

export const UpdatePaymentCardStatusQueueName = 'update-payment-card-status'

export class UpdatePaymentCardStatusQueue extends BaseQueue<UpdatePaymentCardStatusData> {
  constructor(connection: Redis) {
    super(UpdatePaymentCardStatusQueueName, connection)
  }

  async enqueue(data: UpdatePaymentCardStatusData, delay = 0) {
    await this._queue.add(this.queueName, data, {
      delay,
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): UpdatePaymentCardStatusQueue {
    return new UpdatePaymentCardStatusQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
