import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UpdateSettledPaymentData = {
  settlementId: string
}

export const UpdateSettledPaymentQueueName = 'update-settled-payment'

export class UpdateSettledPaymentQueue extends BaseQueue<UpdateSettledPaymentData> {
  constructor(connection: Redis) {
    super(UpdateSettledPaymentQueueName, connection)
  }

  async enqueue(data: UpdateSettledPaymentData, delay = 0) {
    await this._queue.add(this.queueName, data, {
      delay,
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): UpdateSettledPaymentQueue {
    return new UpdateSettledPaymentQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
