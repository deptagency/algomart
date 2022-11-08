import { FactoryMethod } from '@algomart/shared/utils'
import {
  Queue,
  QueueOptions,
  QueueScheduler,
  QueueSchedulerOptions,
} from 'bullmq'
import { Redis } from 'ioredis'

export interface IBaseQueue<
  DataType = void,
  EnqueueDataType extends Partial<DataType> = DataType
> {
  readonly queueName: string
  readonly connection: Redis

  getQueueOptions(): QueueOptions
  getQueueSchedulerOptions(): QueueSchedulerOptions
  enqueue(data: EnqueueDataType): Promise<void>
  close(): Promise<void>
}

export interface BaseQueueConstructor
  extends FactoryMethod<IBaseQueue<unknown, unknown>> {
  new (...args: any[]): IBaseQueue<unknown, unknown>
}

const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7
const FOUR_WEEKS_IN_SECONDS = ONE_WEEK_IN_SECONDS * 4

export abstract class BaseQueue<
  DataType = void,
  EnqueueDataType extends Partial<DataType> = DataType,
  ResultType = void
> implements IBaseQueue<DataType, EnqueueDataType>
{
  protected _queue: Queue<DataType, ResultType>
  protected _scheduler: QueueScheduler

  constructor(
    public readonly queueName: string,
    public readonly connection: Redis
  ) {
    this._queue = new Queue(this.queueName, this.getQueueOptions())

    this._scheduler = new QueueScheduler(
      this.queueName,
      this.getQueueSchedulerOptions()
    )
  }

  get queue() {
    return this._queue
  }

  get scheduler() {
    return this._scheduler
  }

  async getCount(): Promise<number> {
    return await this._queue.count()
  }

  getQueueOptions(): QueueOptions {
    return {
      connection: this.connection as QueueOptions['connection'],
      defaultJobOptions: {
        removeOnComplete: {
          age: ONE_WEEK_IN_SECONDS,
        },
        removeOnFail: {
          age: FOUR_WEEKS_IN_SECONDS,
        },
      },
    }
  }

  getQueueSchedulerOptions(): QueueSchedulerOptions {
    return {
      connection: this.connection as QueueSchedulerOptions['connection'],
      autorun: true,
    }
  }

  async close() {
    await this._queue.close()
    await this._scheduler.close()
  }

  abstract enqueue(data: EnqueueDataType): Promise<void>
}
