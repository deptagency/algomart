import {
  ClaimFreePackSchema,
  ClaimRedeemPackSchema,
  LanguageObjectSchema,
  PackAuctionSchema,
  PackIdSchema,
  PacksByOwnerQuerySchema,
  PacksByOwnerSchema,
  PackSlugSchema,
  PackTemplateIdSchema,
  PackWithCollectiblesSchema,
  PackWithIdSchema,
  PublishedPackSchema,
  PublishedPacksQuerySchema,
  PublishedPacksSchema,
  RedeemCodeObjectSchema,
  TransferPackStatusListSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  claimRandomFreePack,
  claimRedeemPack,
  getAuctionPackByTemplateId,
  getPacksByOwner,
  getPackWithCollectiblesById,
  getPublishedPackBySlug,
  getRedeemablePack,
  searchPublishedPacks,
  transferPackStatus,
} from './packs.routes'

export async function packsRoutes(app: FastifyInstance) {
  const tags = ['packs']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes

  app.get(
    '/:packId',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        description: 'Get a pack by id with its collectibles.',
        querystring: LanguageObjectSchema,
        params: PackIdSchema,
        response: {
          200: PackWithCollectiblesSchema,
        },
      },
    },
    getPackWithCollectiblesById
  )

  app.get(
    '/auction/:templateId',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        description: 'Get the auction information of a pack.',
        params: PackTemplateIdSchema,
        response: {
          200: PackAuctionSchema,
        },
      },
    },
    getAuctionPackByTemplateId
  )

  app.get(
    '/redeemable/:redeemCode',
    {
      config: {
        auth: { anonymous: true },
        rateLimit: {},
      },
      schema: {
        tags,
        description:
          'Get details about a redeemable pack using its redemption code.',
        params: RedeemCodeObjectSchema,
        response: {
          200: Type.Object({ pack: PackWithIdSchema }),
        },
      },
    },
    getRedeemablePack
  )

  app.get(
    '/search',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        description: 'Search all published packs with pagination.',
        querystring: PublishedPacksQuerySchema,
        response: {
          200: PublishedPacksSchema,
        },
      },
    },
    searchPublishedPacks
  )

  app.get(
    '/by-slug/:packSlug',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        description: 'Get a pack by slug with its collectibles.',
        querystring: LanguageObjectSchema,
        params: PackSlugSchema,
        response: {
          200: PublishedPackSchema,
        },
      },
    },
    getPublishedPackBySlug
  )

  app.get(
    '/by-owner',
    {
      schema: {
        tags,
        security,
        description: 'Get published packs for the owner with pagination.',
        querystring: PacksByOwnerQuerySchema,
        response: {
          200: PacksByOwnerSchema,
        },
      },
    },
    getPacksByOwner
  )

  app.post(
    '/claim/free',
    {
      config: {
        rateLimit: {},
      },
      schema: {
        tags,
        security,
        body: ClaimFreePackSchema,
        description: 'Used to claim a free pack.',
        response: {
          200: Type.Object({ pack: PackWithIdSchema }),
        },
      },
    },
    claimRandomFreePack
  )

  app.post(
    '/claim/redeem',
    {
      config: {
        rateLimit: {},
      },
      schema: {
        tags,
        security,
        body: ClaimRedeemPackSchema,
        querystring: LanguageObjectSchema,
        description: 'Used to claim a redeemable pack.',
        response: {
          200: Type.Object({ pack: PackWithIdSchema }),
        },
      },
    },
    claimRedeemPack
  )

  app.get(
    '/transfer/:packId',
    {
      schema: {
        tags,
        security,
        description: 'Get the transfer status of each collectible in the pack.',
        params: PackIdSchema,
        response: {
          200: TransferPackStatusListSchema,
        },
      },
    },
    transferPackStatus
  )
}
