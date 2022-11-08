import {
  AssetIdObjectSchema,
  CollectibleBaseSchema,
  CollectibleIdSchema,
  CollectibleQuerySchema,
  CollectibleShowcaseQuerySchema,
  CollectiblesQuerySchema,
  CollectiblesResponseSchema,
  CollectiblesShowcaseSchema,
  CollectibleUniqueCodeSchema,
  InitializeTransferCollectibleSchema,
  LanguageObjectSchema,
  TransferCollectibleSchema,
  WalletTransactionSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  addCollectibleShowcase,
  exportCollectible,
  getCollectible,
  getCollectibleActivities,
  getCollectibleTemplateByUniqueCode,
  getShowcaseCollectibles,
  importCollectible,
  initializeExportCollectible,
  initializeImportCollectible,
  removeCollectibleShowcase,
  searchCollectibles,
} from './collectibles.routes'

export async function collectiblesRoutes(app: FastifyInstance) {
  const tags = ['collectibles']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes

  app.get(
    '/find-one',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        querystring: CollectibleQuerySchema,
        description: 'Fetch a single collectible and its current owner.',
      },
    },
    getCollectible
  )
  app.get(
    '/activities',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        querystring: AssetIdObjectSchema,
        description: 'Fetch activity history for a single collectible',
      },
    },
    getCollectibleActivities
  )
  app.get(
    '/search',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        querystring: CollectiblesQuerySchema,
        description: 'Searches collectibles',
        response: {
          200: CollectiblesResponseSchema,
        },
      },
    },
    searchCollectibles
  )
  app.get(
    '/template/by-unique-code/:uniqueCode',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        querystring: LanguageObjectSchema,
        params: CollectibleUniqueCodeSchema,
        response: {
          200: CollectibleBaseSchema,
        },
      },
    },
    getCollectibleTemplateByUniqueCode
  )
  app.get(
    '/showcase',
    {
      config: {
        auth: { anonymous: true },
      },
      schema: {
        tags,
        querystring: CollectibleShowcaseQuerySchema,
        response: {
          200: CollectiblesShowcaseSchema,
        },
      },
    },
    getShowcaseCollectibles
  )

  app.post(
    '/showcase',
    {
      schema: {
        tags,
        security,
        body: CollectibleIdSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    addCollectibleShowcase
  )
  app.delete(
    '/showcase',
    {
      schema: {
        tags,
        security,
        body: CollectibleIdSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    removeCollectibleShowcase
  )
  app.post(
    '/export',
    {
      schema: {
        tags,
        security,
        body: InitializeTransferCollectibleSchema,
        response: {
          200: Type.Array(WalletTransactionSchema),
        },
      },
    },
    initializeExportCollectible
  )
  app.post(
    '/export/sign',
    {
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
  app.post(
    '/import',
    {
      schema: {
        tags,
        security,
        body: InitializeTransferCollectibleSchema,
        response: {
          200: Type.Array(WalletTransactionSchema),
        },
      },
    },
    initializeImportCollectible
  )
  app.post(
    '/import/sign',
    {
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
