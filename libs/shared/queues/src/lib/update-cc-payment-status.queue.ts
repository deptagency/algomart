import { CirclePaymentResponse } from '@algomart/schemas'
import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UpdateCcPaymentStatusData = {
  payment: CirclePaymentResponse
}

export const UpdateCcPaymentStatusQueueName = 'update-cc-payment-status'

export class UpdateCcPaymentStatusQueue extends BaseQueue<UpdateCcPaymentStatusData> {
  constructor(connection: Redis) {
    super(UpdateCcPaymentStatusQueueName, connection)
  }

  async enqueue(data: UpdateCcPaymentStatusData, delay = 0) {
    await this._queue.add(this.queueName, data, {
      delay,
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): UpdateCcPaymentStatusQueue {
    return new UpdateCcPaymentStatusQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
