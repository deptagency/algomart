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
}

export default fp(async function fastifyKnex(
  fastify: FastifyInstance,
  options: FastifyKnexOptions
) {
  if (!fastify.knex) {
    const knexInstance = knex(options.knex)

    // Required to configure objection.js
    Model.knex(knexInstance)

    // Make knex available on the fastify instance
    fastify.decorate('knex', knexInstance)

    // Close connection when app shuts down
    fastify.addHook('onClose', async () => {
      await knexInstance.destroy()
    })
  }
})
