import {
  UpdatePaymentCardStatusData,
  UpdatePaymentCardStatusQueueName,
} from '@algomart/shared/queues'
import { PaymentCardService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class UpdatePaymentCardStatusWorker extends BaseWorker<UpdatePaymentCardStatusData> {
  constructor(
    connection: Redis,
    private readonly paymentCardService: PaymentCardService,
    private readonly logger: Logger
  ) {
    super(UpdatePaymentCardStatusQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<UpdatePaymentCardStatusData, void, string>
  ): Promise<void> {
    try {
      await job.log(`Updating Payment Card`)
      const updated =
        await this.paymentCardService.updatePaymentCardFromWebhook(
          job.data.card
        )
      await (updated ? job.log('Updated card') : job.log('Card not found'))
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): UpdatePaymentCardStatusWorker {
    return new UpdatePaymentCardStatusWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PaymentCardService>(PaymentCardService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
