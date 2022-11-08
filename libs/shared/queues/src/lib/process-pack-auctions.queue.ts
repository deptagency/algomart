import { DependencyResolver } from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export const ProcessPackAuctionsQueueName = 'process-pack-auctions'

export class ProcessPackAuctionsQueue extends BaseQueue {
  constructor(connection: Redis) {
    super(ProcessPackAuctionsQueueName, connection)
  }

  async enqueue() {
    await this._queue.add(this.queueName, null, {
      repeat: {
        // Every five minutes
        cron: '*/5 * * * *',
      },
    })
  }

  static create(container: DependencyResolver): ProcessPackAuctionsQueue {
    return new ProcessPackAuctionsQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
