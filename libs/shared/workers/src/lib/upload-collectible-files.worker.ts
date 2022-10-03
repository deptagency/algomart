import {
  UploadCollectibleFilesData,
  UploadCollectibleFilesQueueName,
} from '@algomart/shared/queues'
import { GeneratorService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class UploadCollectibleFilesWorker extends BaseWorker<UploadCollectibleFilesData> {
  constructor(
    connection: Redis,
    private readonly generatorService: GeneratorService
  ) {
    super(UploadCollectibleFilesQueueName, connection)
  }

  async processor(
    job: Job<UploadCollectibleFilesData, void, string>
  ): Promise<void> {
    await this.generatorService.uploadCollectibleFilesIfNeeded(
      job.data.templateId
    )

    await job.log(
      `Uploaded collectible files for template ${job.data.templateId}`
    )

    await this.generatorService.queueCreatePacksIfNeededByCollectibleTemplate(
      job.data.templateId
    )
  }

  static create(container: DependencyResolver): UploadCollectibleFilesWorker {
    return new UploadCollectibleFilesWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<GeneratorService>(GeneratorService.name)
    )
  }
}
