import { CirclePayout } from '@algomart/schemas'
import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UpdateWirePayoutStatusData = CirclePayout

export const UpdateWirePayoutStatusQueueName = 'update-wire-payout-status'

export class UpdateWirePayoutStatusQueue extends BaseQueue<UpdateWirePayoutStatusData> {
  constructor(connection: Redis) {
    super(UpdateWirePayoutStatusQueueName, connection)
  }

  async enqueue(data: UpdateWirePayoutStatusData) {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): UpdateWirePayoutStatusQueue {
    return new UpdateWirePayoutStatusQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
