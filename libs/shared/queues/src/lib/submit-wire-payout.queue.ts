import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type SubmitWirePayoutData = {
  wirePayoutId: string
}

export const SubmitWirePayoutQueueName = 'submit-wire-payout'

export class SubmitWirePayoutQueue extends BaseQueue<SubmitWirePayoutData> {
  constructor(connection: Redis) {
    super(SubmitWirePayoutQueueName, connection)
  }

  async enqueue(data: SubmitWirePayoutData) {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): SubmitWirePayoutQueue {
    return new SubmitWirePayoutQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
