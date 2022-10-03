import {
  UpdateCcPaymentStatusData,
  UpdateCcPaymentStatusQueueName,
} from '@algomart/shared/queues'
import { PaymentsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class UpdateCcPaymentStatusWorker extends BaseWorker<UpdateCcPaymentStatusData> {
  constructor(
    connection: Redis,
    private readonly paymentsService: PaymentsService,
    private readonly logger: Logger
  ) {
    super(UpdateCcPaymentStatusQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<UpdateCcPaymentStatusData, void, string>
  ): Promise<void> {
    try {
      await job.log(`Updating Payment Status`)
      await this.paymentsService.updateCcPaymentStatusFromWebhook(
        job.data.payment
      )
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): UpdateCcPaymentStatusWorker {
    return new UpdateCcPaymentStatusWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PaymentsService>(PaymentsService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
