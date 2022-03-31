import { HomepageSchema, LanguageSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getHomepage } from './homepage.routes'

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
        querystring: LanguageSchema,
        response: {
          200: HomepageSchema,
        },
      },
    },
    getHomepage
  )
}
