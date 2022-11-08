import {
  SubmitWirePayoutData,
  SubmitWirePayoutQueueName,
} from '@algomart/shared/queues'
import { PayoutService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class SubmitWirePayoutWorker extends BaseWorker<SubmitWirePayoutData> {
  constructor(
    connection: Redis,
    private readonly payoutService: PayoutService,
    private readonly logger: Logger
  ) {
    super(SubmitWirePayoutQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(job: Job<SubmitWirePayoutData, void, string>): Promise<void> {
    try {
      const service = this.payoutService
      await job.log(`Submitting wire payout account to circle`)
      await service.submitWirePayoutToCircle(job.data)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): SubmitWirePayoutWorker {
    return new SubmitWirePayoutWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PayoutService>(PayoutService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
