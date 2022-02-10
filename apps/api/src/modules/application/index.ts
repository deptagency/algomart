import { CountriesSchema, LocaleSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { getCountries } from './application.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

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
