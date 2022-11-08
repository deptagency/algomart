import {
  CollectibleListingModelSchema,
  CollectibleListingsQuerySchema,
  CollectibleListingsResponseSchema,
  IdParameterSchema,
  ListCollectibleForSaleSchema,
  UserAccountTransferSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  createListing,
  delistCollectible,
  getListingById,
  purchaseListingWithCredits,
  searchListings,
} from './marketplace.routes'

export async function marketplaceRoutes(app: FastifyInstance) {
  const tags = ['marketplace']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes
  app.get(
    '/listings/:id',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        description: 'Gets a listing by ID',
        params: IdParameterSchema,
        response: {
          200: CollectibleListingModelSchema,
        },
      },
    },
    getListingById
  )
  app.get(
    '/listings/search',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        querystring: CollectibleListingsQuerySchema,
        description: 'Searches collectible listings',
        response: {
          200: CollectibleListingsResponseSchema,
        },
      },
    },
    searchListings
  )
  app.post(
    '/listings',
    {
      schema: {
        tags,
        security,
        description: 'Lists a collectible for sale',
        body: ListCollectibleForSaleSchema,
        response: {
          201: CollectibleListingModelSchema,
        },
      },
    },
    createListing
  )
  app.delete(
    '/listings/:id/delist',
    {
      schema: {
        tags,
        security,
        description: 'Removes the listing of a listed collectible',
        params: IdParameterSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    delistCollectible
  )
  app.post(
    '/listings/:id/purchase',
    {
      schema: {
        tags,
        security,
        description: 'Purchases a listed collectible using credits',
        params: IdParameterSchema,
        response: {
          200: UserAccountTransferSchema,
        },
      },
    },
    purchaseListingWithCredits
  )
}
