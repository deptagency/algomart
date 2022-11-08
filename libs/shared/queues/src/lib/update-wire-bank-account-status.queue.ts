import { CircleWireBankAccount } from '@algomart/schemas'
import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export type UpdateWireBankAccountStatusData = CircleWireBankAccount

export const UpdateWireBankAccountStatusQueueName =
  'update-wire-bank-account-status'

export class UpdateWireBankAccountStatusQueue extends BaseQueue<UpdateWireBankAccountStatusData> {
  constructor(connection: Redis) {
    super(UpdateWireBankAccountStatusQueueName, connection)
  }

  async enqueue(data: UpdateWireBankAccountStatusData) {
    await this._queue.add(this.queueName, data, {
      attempts: exponentialThenDailyBackoff.recommendedAttempts,
      backoff: {
        type: exponentialThenDailyBackoff.type,
      },
    })
  }

  static create(
    container: DependencyResolver
  ): UpdateWireBankAccountStatusQueue {
    return new UpdateWireBankAccountStatusQueue(
      container.get<Redis>('JOBS_REDIS')
    )
  }
}
