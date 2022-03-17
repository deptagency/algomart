import {
  AlgoAddressSchema,
  CollectibleIdSchema,
  CollectibleListQuerystringSchema,
  CollectibleListShowcaseSchema,
  CollectibleListWithTotalSchema,
  CollectiblesByAlgoAddressQuerystringSchema,
  CollectibleShowcaseQuerystringSchema,
  InitializeTransferCollectibleSchema,
  SingleCollectibleQuerystringSchema,
  TransferCollectibleSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import {
  addCollectibleShowcase,
  exportCollectible,
  getCollectible,
  getCollectibles,
  getCollectiblesByAlgoAddress,
  getShowcaseCollectibles,
  importCollectible,
  initializeExportCollectible,
  initializeImportCollectible,
  removeCollectibleShowcase,
} from './collectibles.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function collectiblesRoutes(app: FastifyInstance) {
  const tags = ['collectibles']
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
  app
    .get(
      '/',
      {
        schema: {
          tags,
          security,
          querystring: CollectibleListQuerystringSchema,
          description:
            'Loads collectibles for a single user. One of `ownerUsername` and `ownerExternalId` must be specified.',
          response: {
            200: CollectibleListWithTotalSchema,
          },
        },
      },
      getCollectibles
    )
    .get(
      '/find-one',
      {
        schema: {
          tags,
          security,
          querystring: SingleCollectibleQuerystringSchema,
          description: 'Fetch a single collectible and its current owner.',
        },
      },
      getCollectible
    )
    .get(
      '/address/:algoAddress',
      {
        schema: {
          tags,
          security,
          params: AlgoAddressSchema,
          querystring: CollectiblesByAlgoAddressQuerystringSchema,
          response: {
            200: CollectibleListWithTotalSchema,
          },
        },
      },
      getCollectiblesByAlgoAddress
    )
    .get(
      '/showcase',
      {
        schema: {
          tags,
          security,
          querystring: CollectibleShowcaseQuerystringSchema,
          response: {
            200: CollectibleListShowcaseSchema,
          },
        },
      },
      getShowcaseCollectibles
    )
    .post(
      '/showcase',
      {
        transact: true,
        schema: {
          tags,
          security,
          querystring: CollectibleShowcaseQuerystringSchema,
          body: CollectibleIdSchema,
          response: {
            204: Type.Null(),
          },
        },
      },
      addCollectibleShowcase
    )
    .delete(
      '/showcase',
      {
        transact: true,
        schema: {
          tags,
          security,
          querystring: CollectibleShowcaseQuerystringSchema,
          body: CollectibleIdSchema,
          response: {
            204: Type.Null(),
          },
        },
      },
      removeCollectibleShowcase
    )
    .post(
      '/export',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: InitializeTransferCollectibleSchema,
          response: {
            200: Type.Array(
              Type.Object({
                txnId: Type.String(),
                txn: Type.String(),
                signer: Type.String(),
              })
            ),
          },
        },
      },
      initializeExportCollectible
    )
    .post(
      '/export/sign',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: TransferCollectibleSchema,
          response: {
            200: Type.Object({
              txId: Type.String(),
            }),
          },
        },
      },
      exportCollectible
    )
    .post(
      '/import',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: InitializeTransferCollectibleSchema,
          response: {
            200: Type.Array(
              Type.Object({
                txnId: Type.String(),
                txn: Type.String(),
                signer: Type.String(),
              })
            ),
          },
        },
      },
      initializeImportCollectible
    )
    .post(
      '/import/sign',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: TransferCollectibleSchema,
          response: {
            200: Type.Object({
              txId: Type.String(),
            }),
          },
        },
      },
      importCollectible
    )
}
