import {
  GeneratePacksData,
  GeneratePacksQueueName,
} from '@algomart/shared/queues'
import { GeneratorService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class GeneratePacksWorker extends BaseWorker<GeneratePacksData> {
  constructor(
    connection: Redis,
    private readonly generatorService: GeneratorService
  ) {
    super(GeneratePacksQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      // This job has some very CPU intensive operations and the default lock duration (30s)
      // is sometimes too short. If the CPU is pegged, bull-mq may be unable to renew the lock during
      // execution. This means that bull-mq may be unable to move the job to failed or complete after
      // the job completes (because the lock is expired). So, we increase the lock duration here.
      // N.b. If changing this value make sure to also change stalledInterval in the queue
      lockDuration: 30 * 60 * 1000, // 30 minutes
    }
  }

  async processor(job: Job<GeneratePacksData, void, string>): Promise<void> {
    const count = await this.generatorService.createPacksIfNeeded(
      job.data.templateId
    )

    await job.log(
      `Generated ${count} packs for template ${job.data.templateId}`
    )
  }

  static create(container: DependencyResolver): GeneratePacksWorker {
    return new GeneratePacksWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<GeneratorService>(GeneratorService.name)
    )
  }
}
