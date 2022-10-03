import {
  SubmitUsdcPaymentData,
  SubmitUsdcPaymentQueueName,
} from '@algomart/shared/queues'
import { PaymentsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class SubmitUsdcPaymentWorker extends BaseWorker<SubmitUsdcPaymentData> {
  constructor(
    connection: Redis,
    private readonly paymentsService: PaymentsService,
    private readonly logger: Logger
  ) {
    super(SubmitUsdcPaymentQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<SubmitUsdcPaymentData, void, string>
  ): Promise<void> {
    const service = this.paymentsService
    try {
      await job.log(`Submitting usdc payment to algorand`)
      await service.submitUsdcDepositAlgorandTransaction(job.data)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): SubmitUsdcPaymentWorker {
    return new SubmitUsdcPaymentWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PaymentsService>(PaymentsService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
