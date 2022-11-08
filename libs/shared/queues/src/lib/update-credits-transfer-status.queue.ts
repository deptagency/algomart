import { CircleTransfer } from '@algomart/schemas'
import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UpdateCreditsTransferData = { transfer: CircleTransfer }

export const UpdateCreditsTransferStatusQueueName =
  'update-credits-transfer-status'

export class UpdateCreditsTransferStatusQueue extends BaseQueue<UpdateCreditsTransferData> {
  constructor(connection: Redis) {
    super(UpdateCreditsTransferStatusQueueName, connection)
  }

  async enqueue(data: UpdateCreditsTransferData): Promise<void> {
    await this._queue.add(this.queueName, data, {
      // we have an initial delay here because we expect it to take some time for circle to
      // process a transfer after it's submitted
      delay: 1000,
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(
    container: DependencyResolver
  ): UpdateCreditsTransferStatusQueue {
    return new UpdateCreditsTransferStatusQueue(
      container.get<Redis>('JOBS_REDIS')
    )
  }
}
