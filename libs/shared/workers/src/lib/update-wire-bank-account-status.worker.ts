import {
  UpdateWireBankAccountStatusData,
  UpdateWireBankAccountStatusQueueName,
} from '@algomart/shared/queues'
import { WiresService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class UpdateWireBankAccountStatusWorker extends BaseWorker<UpdateWireBankAccountStatusData> {
  constructor(connection: Redis, private readonly wiresService: WiresService) {
    super(UpdateWireBankAccountStatusQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<UpdateWireBankAccountStatusData, void, string>
  ): Promise<void> {
    const service = this.wiresService
    await job.log('Running update wire bank account status')
    await service.updateWireBankAccountStatus(job.data)
    await job.log('Done')
  }

  static create(
    container: DependencyResolver
  ): UpdateWireBankAccountStatusWorker {
    return new UpdateWireBankAccountStatusWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<WiresService>(WiresService.name)
    )
  }
}
