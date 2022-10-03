import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { QueueSchedulerOptions } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type GeneratePacksData = {
  templateId: string
}

export const GeneratePacksQueueName = 'generate-packs'

export class GeneratePacksQueue extends BaseQueue<GeneratePacksData> {
  constructor(connection: Redis) {
    super(GeneratePacksQueueName, connection)
  }

  override getQueueSchedulerOptions(): QueueSchedulerOptions {
    const base = super.getQueueSchedulerOptions()
    return {
      ...base,
      // This job has some very CPU intensive operations and the default stalled interval (30s)
      // is sometimes too short. (If bull-mq considers the job stalled it can be retried even though
      // it's still executing which could result in duplicate packs being generated)
      // N.b. If changing this value make sure to also change lockDuration in the worker
      stalledInterval: 30 * 60 * 1000, // 30 minutes should be plenty even for lots of packs/ NFTs
    }
  }

  async enqueue(data: GeneratePacksData): Promise<void> {
    await this._queue.add(this.queueName, data, {
      jobId: data.templateId,
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): GeneratePacksQueue {
    return new GeneratePacksQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
