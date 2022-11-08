import { ProcessPackAuctionsQueueName } from '@algomart/shared/queues'
import { PackAuctionService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class ProcessPackAuctionsWorker extends BaseWorker {
  constructor(
    connection: Redis,
    private readonly packAuctionService: PackAuctionService
  ) {
    super(ProcessPackAuctionsQueueName, connection)
  }

  async processor(job: Job<void, void, string>): Promise<void> {
    await job.log(`Processing completed pack auctions...`)
    const count =
      await this.packAuctionService.processRecentlyCompletedPackAuctions()
    await job.log(`Processed ${count} completed pack auctions.`)
  }

  static create(container: DependencyResolver): ProcessPackAuctionsWorker {
    return new ProcessPackAuctionsWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PackAuctionService>(PackAuctionService.name)
    )
  }
}
