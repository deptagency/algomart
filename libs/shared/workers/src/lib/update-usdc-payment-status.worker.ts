import { CircleTransferStatus } from '@algomart/schemas'
import {
  UpdateUsdcPaymentStatusData,
  UpdateUsdcPaymentStatusQueueName,
} from '@algomart/shared/queues'
import { PaymentsService } from '@algomart/shared/services'
import { DependencyResolver } from '@algomart/shared/utils'
import { Job, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'

import { BaseWorker } from './shared-types'

export class UpdateUsdcPaymentStatusWorker extends BaseWorker<UpdateUsdcPaymentStatusData> {
  constructor(
    connection: Redis,
    private readonly paymentsService: PaymentsService
  ) {
    super(UpdateUsdcPaymentStatusQueueName, connection)
  }

  override getWorkerOptions(): WorkerOptions {
    const base = super.getWorkerOptions()
    return {
      ...base,
      concurrency: 20,
    }
  }

  async processor(
    job: Job<UpdateUsdcPaymentStatusData, void, string>
  ): Promise<void> {
    const paymentsService = this.paymentsService
    await job.log('Running update update usdc payment status')
    if (job.data.transfer.status === CircleTransferStatus.Pending) {
      await job.log(`Pending - No action required`)
      return void 0
    }

    await job.log('Completing USDC payment')
    const userAccountTransfer = await paymentsService.updateUsdcPaymentStatus(
      job.data
    )

    // If updateUsdcPaymentStatus was successful, we'll get a transfer back.
    // Use said transfer to kickoff unified flow as ncessary
    await paymentsService.handleUnifiedPaymentHandoff(userAccountTransfer)

    await job.log('Done')
  }

  static create(container: DependencyResolver): UpdateUsdcPaymentStatusWorker {
    return new UpdateUsdcPaymentStatusWorker(
      container.get<Redis>('JOBS_REDIS'),
      container.get<PaymentsService>(PaymentsService.name)
    )
  }
}
