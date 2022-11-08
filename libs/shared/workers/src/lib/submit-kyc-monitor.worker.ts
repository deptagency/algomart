import { OnfidoAdapter } from '@algomart/shared/adapters'
import { UserAccountModel } from '@algomart/shared/models'
import { SubmitKycMonitorQueueName } from '@algomart/shared/queues'
import { AccountsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'

export class SubmitKycMonitorWorker extends BaseWorker {
  constructor(
    connection: Redis,
    private readonly accountsService: AccountsService,
    private readonly onfidoAdapter: OnfidoAdapter,
    private readonly logger: Logger
  ) {
    super(SubmitKycMonitorQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(job: Job<void, void, string>): Promise<void> {
    await job.log('Refreshing KYC monitors for applicants...')

    const applicants = await this.onfidoAdapter.getApplicantsWithoutMonitor()
    await job.log(
      `Creating watchlist monitor for ${applicants.length} applicants...`
    )

    let count = 0

    for (const applicant of applicants) {
      try {
        await job.log(`Submitting subscription to KYC monitor`)
        const monitor = await this.accountsService.subscribeToMonitor(
          applicant.applicantId
        )
        await UserAccountModel.query()
          .findOne('applicantId', applicant.applicantId)
          .patch({
            watchlistMonitorId: monitor.externalId,
          })
      } catch (error) {
        await job.log(
          `Failed to submit subscription to KYC monitor for applicant ${applicant.applicantId}: ${error}`
        )
      }

      await job.updateProgress(++count / applicants.length)
    }

    await job.log('Done creating subscriptions to KYC monitors for applicants.')
    this.logger.info('Finished submit KYC monitor for applicants')
  }

  static create(container: DependencyResolver): SubmitKycMonitorWorker {
    return new SubmitKycMonitorWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<AccountsService>(AccountsService.name),
      container.get<OnfidoAdapter>(OnfidoAdapter.name),
      container.get<Logger>('LOGGER')
    )
  }
}
