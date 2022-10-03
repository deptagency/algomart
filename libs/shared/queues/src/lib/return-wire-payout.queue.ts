import { CircleReturn } from '@algomart/schemas'
import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type ReturnWirePayoutData = CircleReturn

export const ReturnWirePayoutQueueName = 'return-wire-payout'

export class ReturnWirePayoutQueue extends BaseQueue<ReturnWirePayoutData> {
  constructor(connection: Redis) {
    super(ReturnWirePayoutQueueName, connection)
  }

  async enqueue(data: ReturnWirePayoutData) {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): ReturnWirePayoutQueue {
    return new ReturnWirePayoutQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
