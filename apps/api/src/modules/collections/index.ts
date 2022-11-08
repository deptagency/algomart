import {
  CollectiblesQuerySchema,
  CollectionWithSetsSchema,
  LanguageObjectSchema,
  SlugObjectSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import { getAllCollections, getCollection } from './collections.routes'

export async function collectionsRoutes(app: FastifyInstance) {
  const tags = ['collections']

  // Services/Routes
  app
    .get(
      '/',
      {
        schema: {
          tags,
          querystring: CollectiblesQuerySchema,
          response: {
            200: Type.Object({
              total: Type.Integer(),
              collections: Type.Array(CollectionWithSetsSchema),
            }),
          },
        },
      },
      getAllCollections
    )
    .get(
      '/:slug',
      {
        schema: {
          tags,
          params: SlugObjectSchema,
          querystring: LanguageObjectSchema,
          response: {
            200: CollectionWithSetsSchema,
          },
        },
      },
      getCollection
    )
}
