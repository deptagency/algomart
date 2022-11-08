import {
  BalanceAvailableForPayoutResponseSchema,
  InitiateUsdcPayoutRequestSchema,
  InitiateWirePayoutRequestSchema,
  UserAccountTransferSchema,
} from '@algomart/schemas'
import { FastifyInstance } from 'fastify'

import {
  getBalanceAvailableForPayout,
  initiateUsdcPayout,
  initiateWirePayout,
} from './payouts.routes'

export async function payoutsRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['payouts']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes
  app.get(
    '/available-balance',
    {
      schema: {
        tags,
        security,
        response: {
          200: BalanceAvailableForPayoutResponseSchema,
        },
      },
    },
    getBalanceAvailableForPayout
  )
  app.post(
    '/usdc',
    {
      schema: {
        tags,
        security,
        body: InitiateUsdcPayoutRequestSchema,
        response: {
          201: UserAccountTransferSchema,
        },
      },
    },
    initiateUsdcPayout
  )
  app.post(
    '/wire',
    {
      schema: {
        tags,
        security,
        body: InitiateWirePayoutRequestSchema,
        response: {
          201: UserAccountTransferSchema,
        },
      },
    },
    initiateWirePayout
  )
}
