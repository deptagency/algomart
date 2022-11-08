import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export enum SubmitPaymentSteps {
  submitPaymentToCircle = 'submitPaymentToCircle',
  startUpdatePaymentStatus = 'startUpdatePaymentStatus',
}

export const SubmitPaymentStepOrder: SubmitPaymentSteps[] = [
  SubmitPaymentSteps.submitPaymentToCircle,
  SubmitPaymentSteps.startUpdatePaymentStatus,
]

export type PaymentData = {
  paymentId: string
}

export type SubmitPaymentData = PaymentData & {
  step?: SubmitPaymentSteps
}

export const SubmitPaymentQueueName = 'submit-payment'

export class SubmitPaymentQueue extends BaseQueue<SubmitPaymentData> {
  constructor(connection: Redis) {
    super(SubmitPaymentQueueName, connection)
  }

  async enqueue(data: SubmitPaymentData) {
    const step = data.step ?? SubmitPaymentStepOrder[0]
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

  static create(container: DependencyResolver): SubmitPaymentQueue {
    return new SubmitPaymentQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
