import {
  fastifyContainerPlugin,
  fastifyKnexPlugin,
  fastifyQueuePlugin,
  fastifyTrapsPlugin,
} from '@algomart/shared/plugins'
import { DependencyResolver } from '@algomart/shared/utils'
import fastifySensible from '@fastify/sensible'
import fastifySwagger from '@fastify/swagger'
import { setupHealth } from '@scribe/modules/health'
import ajvFormats from 'ajv-formats'
import fastify, { FastifyServerOptions } from 'fastify'
import { Redis } from 'ioredis'
import { Knex } from 'knex'

import { setupBullBoard } from '../modules/bullboard'
import { webhookRoutes } from '../modules/webhooks'

import swaggerOptions from './swagger'

export interface AppConfig {
  knex: Knex.Config
  fastify?: FastifyServerOptions
  container: DependencyResolver
  enableTrap?: boolean
}

const envIsTest = process.env.NODE_ENV === 'test'

export default async function buildApp(config: AppConfig) {
  const app = fastify(
    Object.assign({}, config.fastify, {
      // Enable trust proxy to allow reading x-forwarded-for header
      trustProxy: true,

      ajv: {
        customOptions: {
          removeAdditional: true,
          useDefaults: true,
          // Explicitly set allErrors to `false`.
          // When set to `true`, a DoS attack is possible.
          allErrors: false,
          validateFormats: true,
          // Need to coerce single-item arrays to proper arrays
          coerceTypes: 'array',
          // New as of Ajv v7, strict schema is not compatible with TypeBox
          // The alternative is to wrap EVERYTHING with Type.Strict(...)
          strictSchema: false,
        },
        plugins: [ajvFormats],
      },
    })
  )

  app.log.info('Starting SCRIBE')

  // Plugins
  if (config.enableTrap) {
    await app.register(fastifyTrapsPlugin, {
      // Cloud Run only gives us 10 seconds to shut down
      timeout: 10_000,

      async onClose() {
        app.log.info('SCRIBE closing database connection...')
        await app.knex.destroy()
        app.log.info('SCRIBE closed database connection.')

        app.log.info('SCRIBE closing queues...')
        await Promise.all(app.queues.map((queue) => queue.close()))
        app.log.info('SCRIBE closed queues.')

        app.log.info('SCRIBE closing workers...')
        await Promise.all(app.workers.map((worker) => worker.close()))
        app.log.info('SCRIBE closed workers.')
      },

      async onError(error) {
        app.log.error(error)
      },

      async onTimeout(timeout) {
        app.log.warn(
          `SCRIBE service timed out while closing after ${timeout}ms.`
        )
      },

      async onSignal(signal) {
        app.log.info(`SCRIBE service received signal ${signal}.`)
      },
    })
  }
  await app.register(fastifySwagger, swaggerOptions)
  await app.register(fastifySensible)

  // Our Plugins
  await app.register(fastifyKnexPlugin, { knex: config.knex })
  await app.register(fastifyContainerPlugin, { container: config.container })

  if (!envIsTest) {
    await app.register(fastifyQueuePlugin, {
      container: config.container,
      connection: config.container.get<Redis>('JOBS_REDIS'),
    })
  }

  // Decorators
  // no decorators yet

  // Hooks
  // no hooks yet

  // Services
  await app.register(setupHealth, { prefix: '/health' })
  await app.register(setupBullBoard)
  await app.register(webhookRoutes, { prefix: '/webhooks' })

  return app
}
