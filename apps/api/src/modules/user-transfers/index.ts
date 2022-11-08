import {
  IdParameterSchema,
  UserAccountTransferSchema,
  UserAccountTransfersQuerySchema,
  UserAccountTransfersResponseSchema,
} from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import {
  getUserAccountTransferByEntityId,
  getUserAccountTransferById,
  searchTransfers,
} from './user-transfers.routes'

export async function userTransfersRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['user-transfers']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes
  app
    .get(
      '/:id',
      {
        schema: {
          tags,
          security,
          params: IdParameterSchema,
          response: {
            200: UserAccountTransferSchema,
          },
        },
      },
      getUserAccountTransferById
    )
    .get(
      '/search/entity-id/:id',
      {
        schema: {
          tags,
          security,
          params: IdParameterSchema,
          response: {
            200: UserAccountTransferSchema,
          },
        },
      },
      getUserAccountTransferByEntityId
    )
    .get(
      '/search',
      {
        schema: {
          tags,
          security,
          querystring: UserAccountTransfersQuerySchema,
          response: {
            200: UserAccountTransfersResponseSchema,
          },
        },
      },
      searchTransfers
    )
}
