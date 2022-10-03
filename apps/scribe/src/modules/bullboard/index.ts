import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import { FastifyInstance } from 'fastify'

export async function setupBullBoard(fastify: FastifyInstance) {
  const serverAdapter = new FastifyAdapter()

  createBullBoard({
    queues: fastify.queues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  })

  serverAdapter.setBasePath('/bullboard')
  fastify.register(serverAdapter.registerPlugin(), {
    basePath: '/bullboard',
    prefix: '/bullboard',
  })
}
