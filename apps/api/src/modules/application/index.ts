import { CountriesSchema, LocaleSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getCountries } from './application.routes'

export async function applicationRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['application']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Plugins
  await app.register(fastifyBearerAuth, bearerAuthOptions)

  app.get(
    '/countries',
    {
      transact: true,
      schema: {
        tags,
        security,
        querystring: LocaleSchema,
        response: {
          200: CountriesSchema,
        },
      },
    },
    getCountries
  )
}
