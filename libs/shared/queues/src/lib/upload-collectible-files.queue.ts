import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UploadCollectibleFilesData = {
  templateId: string
}

export const UploadCollectibleFilesQueueName = 'upload-collectible-files'

export class UploadCollectibleFilesQueue extends BaseQueue<UploadCollectibleFilesData> {
  constructor(connection: Redis) {
    super(UploadCollectibleFilesQueueName, connection)
  }

  async enqueue(data: UploadCollectibleFilesData) {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): UploadCollectibleFilesQueue {
    return new UploadCollectibleFilesQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
