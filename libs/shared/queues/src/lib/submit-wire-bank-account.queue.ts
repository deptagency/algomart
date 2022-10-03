import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type SubmitWireBankAccountData = {
  wireBankAccountId: string
}

export const SubmitWireBankAccountQueueName = 'submit-wire-bank-account'

export class SubmitWireBankAccountQueue extends BaseQueue<SubmitWireBankAccountData> {
  constructor(connection: Redis) {
    super(SubmitWireBankAccountQueueName, connection)
  }

  async enqueue(data: SubmitWireBankAccountData) {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): SubmitWireBankAccountQueue {
    return new SubmitWireBankAccountQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
