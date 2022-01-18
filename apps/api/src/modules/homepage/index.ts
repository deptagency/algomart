import { HomepageSchema, LocaleSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getHomepage } from './homepage.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function homepageRoutes(app: FastifyInstance) {
  const tags = ['homepage']
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
        querystring: LocaleSchema,
        response: {
          200: HomepageSchema,
        },
      },
    },
    getHomepage
  )
}
