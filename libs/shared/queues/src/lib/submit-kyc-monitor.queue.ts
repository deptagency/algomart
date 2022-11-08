import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export const SubmitKycMonitorQueueName = 'submit-kyc-monitor'

export class SubmitKycMonitorQueue extends BaseQueue {
  constructor(connection: Redis) {
    super(SubmitKycMonitorQueueName, connection)
  }

  async enqueue() {
    // Clear out existing jobs so we run again on startup
    await this.queue.obliterate()

    await this._queue.add(this.queueName, null, {
      delay: 0,
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
      repeat: {
        immediately: true,

        // run every 12 hours (minute 0 past every 12th hour)
        cron: '0 */12 * * *',
      },
    })
  }

  static create(container: DependencyResolver): SubmitKycMonitorQueue {
    return new SubmitKycMonitorQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
