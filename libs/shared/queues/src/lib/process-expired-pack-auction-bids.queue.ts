import { DependencyResolver } from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export const ProcessExpiredPackAuctionBidsQueueName =
  'process-expired-pack-auction-bids'

export class ProcessExpiredPackAuctionBidsQueue extends BaseQueue {
  constructor(connection: Redis) {
    super(ProcessExpiredPackAuctionBidsQueueName, connection)
  }

  async enqueue(): Promise<void> {
    this.queue.add(this.queueName, null, {
      repeat: {
        // Every five minutes
        cron: '*/5 * * * *',
      },
    })
  }

  static create(
    container: DependencyResolver
  ): ProcessExpiredPackAuctionBidsQueue {
    return new ProcessExpiredPackAuctionBidsQueue(
      container.get<Redis>('JOBS_REDIS')
    )
  }
}
