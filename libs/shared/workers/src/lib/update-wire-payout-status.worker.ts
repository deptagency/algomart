import {
  UpdateWirePayoutStatusData,
  UpdateWirePayoutStatusQueueName,
} from '@algomart/shared/queues'
import { PayoutService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class UpdateWirePayoutStatusWorker extends BaseWorker<UpdateWirePayoutStatusData> {
  constructor(
    connection: Redis,
    private readonly payoutService: PayoutService
  ) {
    super(UpdateWirePayoutStatusQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<UpdateWirePayoutStatusData, void, string>
  ): Promise<void> {
    const service = this.payoutService
    await job.log('Running update payout status')
    await service.updateWirePayoutStatus(job.data)
    await job.log('Done')
  }

  static create(container: DependencyResolver): UpdateWirePayoutStatusWorker {
    return new UpdateWirePayoutStatusWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PayoutService>(PayoutService.name)
    )
  }
}
