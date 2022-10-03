import { DependencyResolver } from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type SyncCMSSteps =
  | 'languages'
  | 'application'
  | 'homepage'
  | 'faqs'
  | 'pages'
  | 'packTemplates'
  | 'collectibleTemplates'
  | 'collections'
  | 'sets'
  | 'tags'

export const SyncCMSStepOrder: SyncCMSSteps[] = [
  'languages',
  'application',
  'homepage',
  'faqs',
  'pages',
  'collectibleTemplates',
  'packTemplates',
  'collections',
  'sets',
  'tags',
]

export type SyncCMSData = {
  step: SyncCMSSteps
}

export const SyncCMSCacheQueueName = 'sync-cms-cache'

export class SyncCMSCacheQueue extends BaseQueue<SyncCMSData> {
  constructor(connection: Redis) {
    super(SyncCMSCacheQueueName, connection)
  }

  async enqueue() {
    // clear out old jobs in this queue to avoid staleness/duplicates
    // and to ensure job runs immediately
    await this.queue.obliterate({
      force: true,
    })

    // schedule job
    await this.queue.add(
      'run-sync-hourly',
      { step: SyncCMSStepOrder[0] },
      {
        // Repeat options must be provided here and not under `defaultJobOptions` above
        repeat: {
          // run on startup
          immediately: true,
          // run every hour
          cron: '24 * * * *',
        },
      }
    )
  }

  static create(container: DependencyResolver): SyncCMSCacheQueue {
    return new SyncCMSCacheQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
