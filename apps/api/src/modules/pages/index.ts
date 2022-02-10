import {
  DirectusPageAndLocaleSchema,
  DirectusPageSchema,
} from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getDirectusPage } from './page.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function pageRoute(app: FastifyInstance) {
  const tags = ['page']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Plugins
  await app.register(fastifyBearerAuth, bearerAuthOptions)

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        security,
        querystring: DirectusPageAndLocaleSchema,
        response: {
          200: DirectusPageSchema,
        },
      },
    },
    getDirectusPage
  )
}
