import {
  LanguageObjectSchema,
  SetWithCollectionSchema,
  SlugObjectSchema,
} from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { getSet } from './sets.routes'

export async function setsRoutes(app: FastifyInstance) {
  const tags = ['sets']

  // Services/Routes
  app.get(
    '/:slug',
    {
      schema: {
        tags,
        params: SlugObjectSchema,
        querystring: LanguageObjectSchema,
        response: {
          200: SetWithCollectionSchema,
        },
      },
    },
    getSet
  )
}
