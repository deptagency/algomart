import { PageAndLanguageSchema, PageBaseSchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { getPage } from './page.routes'

export async function pageRoute(app: FastifyInstance) {
  const tags = ['page']

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        querystring: PageAndLanguageSchema,
        response: {
          200: PageBaseSchema,
        },
      },
    },
    getPage
  )
}
