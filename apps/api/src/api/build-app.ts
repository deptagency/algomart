import swaggerOptions from '@api/configuration/swagger'
import { accountsRoutes } from '@api/modules/accounts'
import { applicationRoutes } from '@api/modules/application'
import { auctionsRoutes } from '@api/modules/auctions'
import { bidsRoutes } from '@api/modules/bids'
import { collectiblesRoutes } from '@api/modules/collectibles'
import { collectionsRoutes } from '@api/modules/collections'
import { homepageRoutes } from '@api/modules/homepage'
import { packsRoutes } from '@api/modules/packs'
import { paymentRoutes } from '@api/modules/payments'
import { setsRoutes } from '@api/modules/sets'
import fastifyContainer from '@api/plugins/container.plugin'
import fastifyKnex from '@api/plugins/knex.plugin'
import fastifyTransaction from '@api/plugins/transaction.plugin'
import DependencyResolver from '@api/shared/dependency-resolver'
import fastifyTraps from '@dnlup/fastify-traps'
import ajvCompiler from '@fastify/ajv-compiler'
import ajvFormats from 'ajv-formats'
import fastify, { FastifyServerOptions } from 'fastify'
import { fastifySchedule } from 'fastify-schedule'
import fastifySensible from 'fastify-sensible'
import fastifySwagger from 'fastify-swagger'
import { Knex } from 'knex'

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

  // Plugins
  if (config.enableTrap) {
    await app.register(fastifyTraps, {
      async onClose() {
        app.log.info('Closing database connection...')
        app.knex.destroy()
        app.log.info('Closed database connection.')
      },
    })
  }
  await app.register(fastifySchedule)
  await app.register(fastifySwagger, swaggerOptions)
  await app.register(fastifySensible)

  // Our Plugins
  await app.register(fastifyKnex, { knex: config.knex })
  await app.register(fastifyContainer, { container: config.container })
  await app.register(fastifyTransaction)

  // Decorators
  // no decorators yet

  // Hooks
  // no hooks yet

  // Services
  await app.register(accountsRoutes, { prefix: '/accounts' })
  await app.register(applicationRoutes, { prefix: '/application' })
  await app.register(auctionsRoutes, { prefix: '/auctions' })
  await app.register(bidsRoutes, { prefix: '/bids' })
  await app.register(collectiblesRoutes, { prefix: '/collectibles' })
  await app.register(collectionsRoutes, { prefix: '/collections' })
  await app.register(homepageRoutes, { prefix: '/homepage' })
  await app.register(packsRoutes, { prefix: '/packs' })
  await app.register(paymentRoutes, { prefix: '/payments' })
  await app.register(setsRoutes, { prefix: '/sets' })

  return app
}
