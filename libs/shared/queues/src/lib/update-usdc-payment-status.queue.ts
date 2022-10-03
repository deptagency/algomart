import { CircleTransfer } from '@algomart/schemas'
import {
  circlePollingBackoff,
  DependencyResolver,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UpdateUsdcPaymentStatusData = {
  transfer: CircleTransfer
}

export const UpdateUsdcPaymentStatusQueueName = 'update-usdc-payment-status'

export class UpdateUsdcPaymentStatusQueue extends BaseQueue<UpdateUsdcPaymentStatusData> {
  constructor(connection: Redis) {
    super(UpdateUsdcPaymentStatusQueueName, connection)
  }

  async enqueue(data: UpdateUsdcPaymentStatusData): Promise<void> {
    await this._queue.add(this.queueName, data, {
      // we have an initial delay here because we expect it to take some time for circle to
      // process a payment after it's submitted
      delay: 1000,
      attempts: circlePollingBackoff.recommendedAttempts,
      backoff: {
        type: circlePollingBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): UpdateUsdcPaymentStatusQueue {
    return new UpdateUsdcPaymentStatusQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
