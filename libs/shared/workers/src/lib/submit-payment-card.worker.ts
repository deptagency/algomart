import {
  SubmitPaymentCardData,
  SubmitPaymentCardQueueName,
} from '@algomart/shared/queues'
import { PaymentCardService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class SubmitPaymentCardWorker extends BaseWorker<SubmitPaymentCardData> {
  constructor(
    connection: Redis,
    private readonly paymentCardService: PaymentCardService,
    private readonly logger: Logger
  ) {
    super(SubmitPaymentCardQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<SubmitPaymentCardData, void, string>
  ): Promise<void> {
    try {
      await job.log(`Submitting payment card to circle`)
      await this.paymentCardService.submitPaymentCardToCircle(job.data)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): SubmitPaymentCardWorker {
    return new SubmitPaymentCardWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PaymentCardService>(PaymentCardService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
