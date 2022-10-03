import {
  DependencyResolver,
  exponentialThenDailyBackoff,
} from '@algomart/shared/utils'
import { Redis } from 'ioredis'

import { BaseQueue } from './shared'

export enum ClaimPackSteps {
  ensureAccountMinBalance = 'ensureAccountMinBalance',
  mintPackCollectibles = 'mintPackCollectibles',
  transferPack = 'transferPack',
  notifyPackOwner = 'notifyPackOwner',
}

export const ClaimPackStepOrder: ClaimPackSteps[] = [
  ClaimPackSteps.ensureAccountMinBalance,
  ClaimPackSteps.mintPackCollectibles,
  ClaimPackSteps.transferPack,
  ClaimPackSteps.notifyPackOwner,
]

export type ClaimPackData = {
  userId?: string
  packId: string
  step?: ClaimPackSteps
}

export const ClaimPackQueueName = 'claim-pack'

export class ClaimPackQueue extends BaseQueue<ClaimPackData> {
  constructor(connection: Redis) {
    super(ClaimPackQueueName, connection)
  }

  async enqueue(data: ClaimPackData): Promise<void> {
    const step = data.step ?? ClaimPackStepOrder[0]
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

  static create(container: DependencyResolver): ClaimPackQueue {
    return new ClaimPackQueue(container.get<Redis>('JOBS_REDIS'))
  }
}
