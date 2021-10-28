import { SetWithCollectionSchema, SlugSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getSet } from './sets.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

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
        response: {
          200: SetWithCollectionSchema,
        },
      },
    },
    getSet
  )
}
