import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type PaymentCardData = {
  cardId: string
  idempotencyKey?: string
}

export type SubmitPaymentCardData = PaymentCardData

export const SubmitPaymentCardQueueName = 'submit-payment-card'

export class SubmitPaymentCardQueue extends BaseQueue<SubmitPaymentCardData> {
  constructor(connection: Redis) {
    super(SubmitPaymentCardQueueName, connection)
  }

  async enqueue(data: SubmitPaymentCardData) {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(container: DependencyResolver): SubmitPaymentCardQueue {
    return new SubmitPaymentCardQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
