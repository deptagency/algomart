import {
  CreateAuctionBodySchema,
  SetupAuctionBodySchema,
} from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { createAuction, setupAuction } from './auctions.routes'

export async function auctionsRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['auctions']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Plugins
  await app.register(fastifyBearerAuth, bearerAuthOptions)

  app
    .post(
      '/',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: CreateAuctionBodySchema,
        },
      },
      createAuction
    )
    .post(
      '/setup',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: SetupAuctionBodySchema,
        },
      },
      setupAuction
    )
}
