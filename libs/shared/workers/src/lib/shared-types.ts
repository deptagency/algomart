import {
  circlePollingBackoff,
  exponentialThenDailyBackoff,
  FactoryMethod,
} from '@algomart/shared/utils'
import { Job, Worker, WorkerOptions } from 'bullmq'
import { Redis } from 'ioredis'

export interface IBaseWorker<DataType = void, ReturnType = void> {
  readonly queueName: string
  readonly connection: Redis

  getWorkerOptions(): WorkerOptions
  processor(job: Job<DataType, ReturnType>): Promise<ReturnType>
  close(): Promise<void>
}

export interface BaseWorkerConstructor
  extends FactoryMethod<IBaseWorker<unknown, unknown>> {
  new (...args: any[]): IBaseWorker<unknown, unknown>
}

export abstract class BaseWorker<DataType = void, ResultType = void> {
  protected _worker: Worker<DataType, ResultType>

  constructor(
    public readonly queueName: string,
    public readonly connection: Redis
  ) {
    this._worker = new Worker(
      this.queueName,
      this.processor.bind(this),
      this.getWorkerOptions()
    )
  }

  get worker() {
    return this._worker
  }

  getWorkerOptions(): WorkerOptions {
    return {
      connection: this.connection as WorkerOptions['connection'],
      autorun: true,
      settings: {
        backoffStrategies: {
          [exponentialThenDailyBackoff.type]: exponentialThenDailyBackoff,
          [circlePollingBackoff.type]: circlePollingBackoff,
        },
      },
    }
  }

  async close() {
    await this._worker.close()
  }

  abstract processor(job: Job<DataType, ResultType>): Promise<ResultType>
}
