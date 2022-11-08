import {
  SubmitWireBankAccountData,
  SubmitWireBankAccountQueueName,
} from '@algomart/shared/queues'
import { WiresService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class SubmitWireBankAccountWorker extends BaseWorker<SubmitWireBankAccountData> {
  constructor(
    connection: Redis,
    private readonly wiresService: WiresService,
    private readonly logger: Logger
  ) {
    super(SubmitWireBankAccountQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<SubmitWireBankAccountData, void, string>
  ): Promise<void> {
    try {
      const service = this.wiresService
      await job.log(`Submitting bank account to circle`)
      await service.submitWireBankAccountToCircle(job.data)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): SubmitWireBankAccountWorker {
    return new SubmitWireBankAccountWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<WiresService>(WiresService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
