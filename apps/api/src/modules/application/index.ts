import { CountriesSchema, LanguageObjectSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { getCountries } from './application.routes'

export async function applicationRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['application']

  app.get(
    '/countries',
    {
      schema: {
        tags,
        querystring: LanguageObjectSchema,
        response: {
          200: CountriesSchema,
        },
      },
    },
    getCountries
  )
}
