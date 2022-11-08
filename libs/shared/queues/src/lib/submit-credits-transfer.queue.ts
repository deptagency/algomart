import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type SubmitCreditsTransferData = {
  userAccountTransferId: string
}

export const SubmitCreditsTransferQueueName = 'submit-credits-transfer'

export class SubmitCreditsTransferQueue extends BaseQueue<SubmitCreditsTransferData> {
  constructor(connection: Redis) {
    super(SubmitCreditsTransferQueueName, connection)
  }

  async enqueue(data: SubmitCreditsTransferData, delay = 0) {
    await this._queue.add(this.queueName, data, {
      delay,
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): SubmitCreditsTransferQueue {
    return new SubmitCreditsTransferQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
