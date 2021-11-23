import {
  ClaimFreePackSchema,
  ClaimPackSchema,
  ClaimRedeemPackSchema,
  LocaleAndExternalIdSchema,
  LocaleSchema,
  MintPackSchema,
  MintPackStatusResponseSchema,
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
  TransferPackStatusListSchema,
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
  mintPack,
  mintPackStatus,
  transferPack,
  transferPackStatus,
  untransferredPacks,
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
    '/mint',
    {
      transact: true,
      schema: {
        tags,
        security,
        description: 'Mint all NFTs in a single pack owned by a user.',
        body: MintPackSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    mintPack
  )

  app.get(
    '/mint',
    {
      schema: {
        tags,
        security,
        description: 'Get the minting status of a pack.',
        querystring: MintPackSchema,
        response: {
          200: MintPackStatusResponseSchema,
        },
      },
    },
    mintPackStatus
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

  app.get(
    '/untransferred',
    {
      schema: {
        tags,
        security,
        description: 'Get all packs that have not been transferred.',
        querystring: LocaleAndExternalIdSchema,
        response: {
          200: PacksByOwnerSchema,
        },
      },
    },
    untransferredPacks
  )
}
