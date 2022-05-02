import {
  LanguageSchema,
  SetWithCollectionSchema,
  SlugSchema,
} from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import fastifyBearerAuth from '@fastify/bearer-auth'
import { FastifyInstance } from 'fastify'

import { getSet } from './sets.routes'

export async function setsRoutes(app: FastifyInstance) {
  const tags = ['sets']
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
    '/:slug',
    {
      schema: {
        tags,
        security,
        params: SlugSchema,
        querystring: LanguageSchema,
        response: {
          200: SetWithCollectionSchema,
        },
      },
    },
    getSet
  )
}
