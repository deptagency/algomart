import { ProcessExpiredPackAuctionBidsQueueName } from '@algomart/shared/queues'
import { PackAuctionService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class ProcessExpiredPackAuctionBidsWorker extends BaseWorker {
  constructor(
    connection: Redis,
    private readonly packAuctionService: PackAuctionService
  ) {
    super(ProcessExpiredPackAuctionBidsQueueName, connection)
  }

  async processor(job: Job<void, void, string>): Promise<void> {
    await job.log(`Processing expired pack auction bids...`)
    const count = await this.packAuctionService.processExpiredPackAuctionBids()
    await job.log(`Processed ${count} expired pack auction bids.`)
  }

  static create(
    container: DependencyResolver
  ): ProcessExpiredPackAuctionBidsWorker {
    return new ProcessExpiredPackAuctionBidsWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PackAuctionService>(PackAuctionService.name)
    )
  }
}
