import {
  FastifyInstance,
  FastifyPluginOptions,
  preHandlerAsyncHookHandler,
} from 'fastify'
import fp from 'fastify-plugin'
import knex, { Knex } from 'knex'
import { Model } from 'objection'

import { addHandler } from './transaction.plugin'

declare module 'fastify' {
  interface FastifyInstance {
    knexMain: Knex
    knexRead?: Knex
  }
}

export interface FastifyKnexOptions extends FastifyPluginOptions {
  knex: Knex.Config
  name: string
}

export enum KnexConnectionType {
  WRITE = 'knexMain',
  READ = 'knexRead',
}

export default fp(async function fastifyKnex(
  fastify: FastifyInstance,
  options: FastifyKnexOptions
) {
  const name = options?.name || KnexConnectionType.WRITE

  const preHandler: preHandlerAsyncHookHandler = async (request) => {
    const knexConnection = fastify[KnexConnectionType.READ]
    request.knexRead = knexConnection
  }

  if (!fastify[name]) {
    const knexInstance = knex(options.knex)

    // Make knex available on the fastify instance
    fastify.decorate(name, knexInstance)

    // Close connection when app shuts down
    fastify.addHook('onClose', async () => {
      await knexInstance.destroy()
    })

    if (name === KnexConnectionType.READ) {
      fastify.addHook('onRoute', (route) => {
        route.preHandler = addHandler(route.preHandler, preHandler)
      })
    } else {
      Model.knex(knexInstance)
    }
  }
})
