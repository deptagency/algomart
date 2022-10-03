import {
  LanguageObjectSchema,
  TagListQuerySchema,
  TagQueryObjectSchema,
  TagsSchema,
} from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import { listTagsBySlugs, searchTags } from './tags.routes'

export async function tagsRoutes(app: FastifyInstance) {
  const tags = ['tags']

  // Services/Routes
  app.get(
    '/search/:query',
    {
      schema: {
        tags,
        params: TagQueryObjectSchema,
        querystring: LanguageObjectSchema,
        response: {
          200: TagsSchema,
        },
      },
    },
    searchTags
  )

  app.get(
    '/list',
    {
      schema: {
        tags,
        querystring: TagListQuerySchema,
        response: {
          200: TagsSchema,
        },
      },
    },
    listTagsBySlugs
  )
}
