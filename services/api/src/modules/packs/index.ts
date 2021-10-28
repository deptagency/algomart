import {
  ClaimFreePackSchema,
  ClaimPackSchema,
  ClaimRedeemPackSchema,
  LocaleSchema,
  OwnerExternalIdSchema,
  PackAuctionSchema,
  PackIdSchema,
  PacksByOwnerQuerySchema,
  PacksByOwnerSchema,
  PackTemplateIdSchema,
  PackWithCollectiblesSchema,
  PackWithIdSchema,
  PublishedPacksQuerySchema,
  PublishedPacksSchema,
  RedeemCodeSchema,
  TransferPackSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import {
  claimPack,
  claimRandomFreePack,
  claimRedeemPack,
  getAuctionPackByTemplateId,
  getPacksByOwner,
  getPackWithCollectiblesById,
  getPublishedPacks,
  getRedeemablePack,
  transferPack,
} from './packs.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function packsRoutes(app: FastifyInstance) {
  const tags = ['packs']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Plugins
  await app.register(fastifyBearerAuth, bearerAuthOptions)

  // Services/Routes
  app.get(
    '/',
    {
      schema: {
        tags,
        security,
        description: 'Get all published packs with pagination.',
        querystring: PublishedPacksQuerySchema,
        response: {
          200: PublishedPacksSchema,
        },
      },
    },
    getPublishedPacks
  )

  app.get(
    '/by-owner/:ownerExternalId',
    {
      schema: {
        tags,
        security,
        description: 'Get published packs for the owner with pagination.',
        querystring: PacksByOwnerQuerySchema,
        params: OwnerExternalIdSchema,
        response: {
          200: PacksByOwnerSchema,
        },
      },
    },
    getPacksByOwner
  )

  app.get(
    '/:packId',
    {
      schema: {
        tags,
        security,
        description: 'Get a pack by id with its collectibles.',
        querystring: LocaleSchema,
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
      schema: {
        tags,
        security,
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
      schema: {
        tags,
        security,
        description:
          'Get details about a redeemable pack using its redemption code.',
        params: RedeemCodeSchema,
        response: {
          200: Type.Object({ pack: PackWithIdSchema }),
        },
      },
    },
    getRedeemablePack
  )

  app.post(
    '/claim',
    {
      transact: true,
      schema: {
        tags,
        security,
        body: ClaimPackSchema,
        description: 'Used to claim purchasable and auction packs.',
        response: {
          200: Type.Object({ pack: PackWithIdSchema }),
        },
      },
    },
    claimPack
  )

  app.post(
    '/claim/free',
    {
      transact: true,
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
      transact: true,
      schema: {
        tags,
        security,
        body: ClaimRedeemPackSchema,
        querystring: LocaleSchema,
        description: 'Used to claim a redeemable pack.',
        response: {
          200: Type.Object({ pack: PackWithIdSchema }),
        },
      },
    },
    claimRedeemPack
  )

  app.post(
    '/transfer',
    {
      transact: true,
      schema: {
        tags,
        security,
        description:
          'Used to initiate the transfer of a previously claimed pack.',
        body: TransferPackSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    transferPack
  )
}
