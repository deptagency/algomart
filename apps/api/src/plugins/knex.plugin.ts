import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import knex, { Knex } from 'knex'
import { Model } from 'objection'

declare module 'fastify' {
  interface FastifyInstance {
    knex: Knex
  }
}

export interface FastifyKnexOptions extends FastifyPluginOptions {
  knex: Knex.Config
  name: string
}

export default fp(async function fastifyKnex(
  fastify: FastifyInstance,
  options: FastifyKnexOptions
) {
  const name = options?.name || 'knex'

  if (!fastify[name]) {
    const knexInstance = knex(options.knex)

    // Required to configure objection.js
    Model.knex(knexInstance)

    // Make knex available on the fastify instance
    fastify.decorate(name, knexInstance)

    // Close connection when app shuts down
    fastify.addHook('onClose', async () => {
      await knexInstance.destroy()
    })
  }
})
