import { PageAndLocaleSchema, PageSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getPage } from './page.routes'

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
        querystring: PageAndLocaleSchema,
        response: {
          200: PageSchema,
        },
      },
    },
    getPage
  )
}
