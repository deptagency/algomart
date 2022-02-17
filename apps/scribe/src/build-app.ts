import ajvCompiler from '@fastify/ajv-compiler'
import ajvFormats from 'ajv-formats'
import fastify, { FastifyServerOptions } from 'fastify'
import { fastifySchedule } from 'fastify-schedule'
import fastifySensible from 'fastify-sensible'
import fastifySwagger from 'fastify-swagger'

import swaggerOptions from './configuration/swagger'
// import { accountsRoutes } from '@scribe/modules/accounts'
// import { auctionsRoutes } from '@scribe/modules/auctions'
// import { bidsRoutes } from '@scribe/modules/bids'
// import { collectiblesRoutes } from '@scribe/modules/collectibles'
// import { collectionsRoutes } from '@scribe/modules/collections'
// import { faqsRoutes } from '@scribe/modules/faqs'
// import { homepageRoutes } from '@scribe/modules/homepage'
// import { languagesRoutes } from '@scribe/modules/languages'
// import { packsRoutes } from '@scribe/modules/packs'
// import { pageRoute } from '@scribe/modules/pages'
// import { paymentRoutes } from '@scribe/modules/payments'
// import { setsRoutes } from '@scribe/modules/sets'
// import fastifyKnex from '@scribe/plugins/knex.plugin'

import {
  fastifyContainerPlugin,
  fastifyTransactionPlugin,
} from '@algomart/shared/plugins'

import { DependencyResolver } from '@algomart/shared/utils'

export interface AppConfig {
  //// knex: Knex.Config
  fastify?: FastifyServerOptions
  container: DependencyResolver
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
  await app.register(fastifySchedule)
  await app.register(fastifySwagger, swaggerOptions)
  await app.register(fastifySensible)

  // Our Plugins
  /////await app.register(fastifyKnex, { knex: config.knex })
  await app.register(fastifyContainerPlugin, { container: config.container })
  await app.register(fastifyTransactionPlugin)

  // Decorators
  // no decorators yet

  // Hooks
  // no hooks yet

  // Services
  // TODO: implement routes to handle data changed callbacks from CMS

  return app
}
