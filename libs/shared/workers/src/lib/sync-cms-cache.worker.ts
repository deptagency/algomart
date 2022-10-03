import {
  SyncCMSCacheQueueName,
  SyncCMSData,
  SyncCMSStepOrder,
  SyncCMSSteps,
} from '@algomart/shared/queues'
import { CMSCacheService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'
import { getNextStep } from './utils'

export class SyncCMSCacheWorker extends BaseWorker<SyncCMSData> {
  constructor(
    connection: Redis,
    private readonly cmsCacheService: CMSCacheService,
    private readonly logger: Logger
  ) {
    super(SyncCMSCacheQueueName, connection)
  }

  async processor(job: Job<SyncCMSData, void, string>): Promise<void> {
    const stepSync: Record<SyncCMSSteps, () => Promise<void>> = {
      languages: this.cmsCacheService.syncAllLanguages.bind(
        this.cmsCacheService
      ),
      application: this.cmsCacheService.syncApplication.bind(
        this.cmsCacheService
      ),
      homepage: this.cmsCacheService.syncHomePage.bind(this.cmsCacheService),
      tags: this.cmsCacheService.syncAllTags.bind(this.cmsCacheService),
      faqs: this.cmsCacheService.syncAllFaqs.bind(this.cmsCacheService),
      pages: this.cmsCacheService.syncAllPages.bind(this.cmsCacheService),
      packTemplates: this.cmsCacheService.syncAllPackTemplates.bind(
        this.cmsCacheService
      ),
      collectibleTemplates:
        this.cmsCacheService.syncAllCollectibleTemplates.bind(
          this.cmsCacheService
        ),
      collections: this.cmsCacheService.syncAllCollections.bind(
        this.cmsCacheService
      ),
      sets: this.cmsCacheService.syncAllSets.bind(this.cmsCacheService),
    }

    let { step } = job.data

    // Based on https://docs.bullmq.io/patterns/process-step-jobs
    try {
      while (step) {
        const func = stepSync[step]
        if (func) {
          await func()
          await job.log(`synced ${step} from cms`)
          step = getNextStep(step, SyncCMSStepOrder)

          if (step) {
            // let bullmq know this job is still being processed
            await job.update({ step })
          } else {
            this.logger.info('finished cms sync')
            // return to end this job process, the repeat schedule (if any) will
            // start it again as needed
            return
          }
        } else {
          throw new Error(`no cms sync function for ${step}`)
        }
      }
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): SyncCMSCacheWorker {
    return new SyncCMSCacheWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<CMSCacheService>(CMSCacheService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
