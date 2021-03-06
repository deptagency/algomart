import { generateHealthRoutes } from '@algomart/shared/modules'
import {
  fastifyContainerPlugin,
  fastifyKnexPlugin,
  fastifyTransactionPlugin,
} from '@algomart/shared/plugins'
import { DependencyResolver } from '@algomart/shared/utils'
import fastifyTraps from '@dnlup/fastify-traps'
import ajvCompiler from '@fastify/ajv-compiler'
import fastifySensible from '@fastify/sensible'
import fastifySwagger from '@fastify/swagger'
import ajvFormats from 'ajv-formats'
import fastify, { FastifyServerOptions } from 'fastify'
import { fastifySchedule } from 'fastify-schedule'
import { Knex } from 'knex'
import { webhookRoutes } from '../modules/webhooks'
import swaggerOptions from './swagger'

export interface AppConfig {
  knex: Knex.Config
  fastify?: FastifyServerOptions
  container: DependencyResolver
  enableTrap?: boolean
}

export default async function buildApp(config: AppConfig) {
  const app = fastify(
    Object.assign({}, config.fastify, {
      // https://www.nearform.com/blog/upgrading-fastifys-input-validation-to-ajv-version-8/
      // https://www.fastify.io/docs/latest/Server/#schemacontroller
      schemaController: {
        compilersFactory: {
          buildValidator: ajvCompiler(),
        },
      },

      ajv: {
        customOptions: {
          removeAdditional: true,
          useDefaults: true,
          allErrors: true,
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

  app.log.info('Starting scribe')

  // Plugins
  if (config.enableTrap) {
    await app.register(fastifyTraps, {
      async onClose() {
        app.log.info('Scribe closing database connection...')
        app.knex.destroy()
        app.log.info('Scribe closed database connection.')
      },
    })
  }
  await app.register(fastifySchedule)
  await app.register(fastifySwagger, swaggerOptions)
  await app.register(fastifySensible)

  // Our Plugins
  await app.register(fastifyKnexPlugin, { knex: config.knex })
  await app.register(fastifyContainerPlugin, { container: config.container })
  await app.register(fastifyTransactionPlugin)

  // Decorators
  // no decorators yet

  // Hooks
  // no hooks yet

  // Services
  await app.register(generateHealthRoutes(), { prefix: '/health' })
  await app.register(webhookRoutes, { prefix: '/webhooks' })

  return app
}
