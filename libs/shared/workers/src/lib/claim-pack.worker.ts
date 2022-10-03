import {
  ClaimPackData,
  ClaimPackQueueName,
  ClaimPackStepOrder,
  ClaimPackSteps,
} from '@algomart/shared/queues'
import { ClaimPackService } from '@algomart/shared/services'
import { DependencyResolver, invariant } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'
import { Logger } from 'pino'

import { BaseWorker } from './shared-types'
import { getNextStep } from './utils'

export class ClaimPackWorker extends BaseWorker<ClaimPackData> {
  constructor(
    connection: Redis,
    private readonly claimPackService: ClaimPackService,
    private readonly logger: Logger
  ) {
    super(ClaimPackQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(job: Job<ClaimPackData, void, string>): Promise<void> {
    const stepFunctionLookup: Record<
      ClaimPackSteps,
      (data: ClaimPackData) => Promise<void>
    > = {
      [ClaimPackSteps.ensureAccountMinBalance]:
        this.claimPackService.ensureAccountMinBalanceForPack.bind(
          this.claimPackService
        ),
      [ClaimPackSteps.mintPackCollectibles]:
        this.claimPackService.mintPackCollectibles.bind(this.claimPackService),
      [ClaimPackSteps.transferPack]: this.claimPackService.transferPack.bind(
        this.claimPackService
      ),
      [ClaimPackSteps.notifyPackOwner]:
        this.claimPackService.notifyPackOwner.bind(this.claimPackService),
    }

    let { step } = job.data

    try {
      while (step) {
        const func = stepFunctionLookup[step]
        invariant(func, `Missing step: ${step}`)
        await func(job.data)
        await job.log(`Completed step: ${step}`)
        step = getNextStep(step, ClaimPackStepOrder)
        if (step) {
          await job.update({
            ...job.data,
            step,
          })
        }
      }
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  static create(container: DependencyResolver): ClaimPackWorker {
    return new ClaimPackWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<ClaimPackService>(ClaimPackService.name),
      container.get<Logger>('LOGGER')
    )
  }
}
