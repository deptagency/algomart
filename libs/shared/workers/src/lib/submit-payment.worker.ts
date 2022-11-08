import {
  SubmitPaymentData,
  SubmitPaymentQueueName,
} from '@algomart/shared/queues'
import { PaymentsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class SubmitPaymentWorker extends BaseWorker<SubmitPaymentData> {
  constructor(
    connection: Redis,
    private readonly paymentsService: PaymentsService,
    private readonly logger: Logger
  ) {
    super(SubmitPaymentQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(job: Job<SubmitPaymentData, void, string>): Promise<void> {
    try {
      const service = this.paymentsService
      await job.log(`Submitting payment to circle`)
      await service.submitPaymentToCircle(job.data)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): SubmitPaymentWorker {
    return new SubmitPaymentWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PaymentsService>(PaymentsService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
