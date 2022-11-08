import { CheckMerchantBalanceQueueName } from '@algomart/shared/queues'
import { CheckMerchantBalanceService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class CheckMerchantBalanceWorker extends BaseWorker {
  constructor(
    connection: Redis,
    private readonly checkMerchantBalanceService: CheckMerchantBalanceService
  ) {
    super(CheckMerchantBalanceQueueName, connection)
  }

  async processor(job: Job<void, void, string>): Promise<void> {
    const { status } =
      await this.checkMerchantBalanceService.checkMerchantAccountBalance()

    await job.log(status)
  }

  static create(container: DependencyResolver): CheckMerchantBalanceWorker {
    return new CheckMerchantBalanceWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<CheckMerchantBalanceService>(
        CheckMerchantBalanceService.name
      )
    )
  }
}
