import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'
import { PaymentData } from './submit-payment.queue'

export enum SubmitUsdcPaymentSteps {
  submitAlgorandTransaction = 'submitAlgorandTransaction',
  startUpdateUsdcPaymentStatus = 'startUpdateUsdcPaymentStatus',
}

export const SubmitUsdcPaymentStepOrder: SubmitUsdcPaymentSteps[] = [
  SubmitUsdcPaymentSteps.submitAlgorandTransaction,
  SubmitUsdcPaymentSteps.startUpdateUsdcPaymentStatus,
]

export type SubmitUsdcPaymentData = PaymentData & {
  step?: SubmitUsdcPaymentSteps
}

export const SubmitUsdcPaymentQueueName = 'submit-usdc-payment'

export class SubmitUsdcPaymentQueue extends BaseQueue<SubmitUsdcPaymentData> {
  constructor(connection: Redis) {
    super(SubmitUsdcPaymentQueueName, connection)
  }

  async enqueue(data: SubmitUsdcPaymentData) {
    const step = data.step ?? SubmitUsdcPaymentStepOrder[0]
    await this._queue.add(
      this.queueName,
      {
        ...data,
        step,
      },
      {
        attempts: exponentialThenDailyBackoff.recommendedAttempts,
        backoff: {
          type: exponentialThenDailyBackoff.type,
        },
      }
    )
  }

  static create(container: DependencyResolver): SubmitUsdcPaymentQueue {
    return new SubmitUsdcPaymentQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
