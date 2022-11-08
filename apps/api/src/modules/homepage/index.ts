import { HomepageSchema, LanguageObjectSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { getHomepage } from './homepage.routes'

export async function homepageRoutes(app: FastifyInstance) {
  const tags = ['homepage']

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        querystring: LanguageObjectSchema,
        response: {
          200: HomepageSchema,
        },
      },
    },
    getHomepage
  )
}
