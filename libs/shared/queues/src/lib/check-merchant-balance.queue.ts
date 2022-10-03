import { DependencyResolver } from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export const CheckMerchantBalanceQueueName = 'check-merchant-balance'

export class CheckMerchantBalanceQueue extends BaseQueue {
  constructor(connection: Redis) {
    super(CheckMerchantBalanceQueueName, connection)
  }

  async enqueue(): Promise<void> {
    await this._queue.obliterate({ force: true })

    await this._queue.add(this.queueName, null, {
      repeat: {
        // run on startup
        immediately: true,

        // run every ten minutes
        cron: '*/10 * * * *',
      },
    })
  }

  static create(container: DependencyResolver): CheckMerchantBalanceQueue {
    return new CheckMerchantBalanceQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
