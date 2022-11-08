import { BaseQueue, queues } from '@algomart/shared/queues'
import { DependencyResolver } from '@algomart/shared/utils'
import { BaseWorker, workers } from '@algomart/shared/workers'
import { Queue, Worker } from 'bullmq'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Redis } from 'ioredis'

declare module 'fastify' {
  interface FastifyInstance {
    queues: Queue[]
    workers: Worker[]
  }
}

export declare type FastifyQueueOptions = {
  connection: Redis
  container: DependencyResolver
}

/**
 * Load every worker function inside a specified directory
 * @param fastify - Fastify instance
 * @param options - Plugin's options
 */
const fastifyBullMQ = async (fastify: FastifyInstance) => {
  const bullQueues = queues.map(
    (BaseQueue) => fastify.container.get<BaseQueue>(BaseQueue.name).queue
  )
  const bullWorkers = Object.values(workers).map(
    (BaseWorker) => fastify.container.get<BaseWorker>(BaseWorker.name).worker
  )

  fastify.decorate('queues', bullQueues)
  fastify.decorate('workers', bullWorkers)
}

export const fastifyQueuePlugin = fp<FastifyQueueOptions>(fastifyBullMQ, {
  name: 'fastify-queue',
})
