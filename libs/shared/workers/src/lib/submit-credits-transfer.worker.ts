import {
  SubmitCreditsTransferData,
  SubmitCreditsTransferQueueName,
} from '@algomart/shared/queues'
import { UserAccountTransfersService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class SubmitCreditsTransferWorker extends BaseWorker<SubmitCreditsTransferData> {
  constructor(
    connection: Redis,
    private readonly userAccountTransfersService: UserAccountTransfersService,
    private readonly logger: Logger
  ) {
    super(SubmitCreditsTransferQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<SubmitCreditsTransferData, void, string>
  ): Promise<void> {
    try {
      const service = this.userAccountTransfersService
      await job.log(`Creating circle wallet transfer`)
      await service.createCircleTransferForUserAccountTransfer(job.data)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): SubmitCreditsTransferWorker {
    return new SubmitCreditsTransferWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<UserAccountTransfersService>(
        UserAccountTransfersService.name
      ),
      container.get<Logger>('LOGGER')
    )
  }
}
