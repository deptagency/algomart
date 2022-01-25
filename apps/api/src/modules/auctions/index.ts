import { CreateAuctionBodySchema } from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { createAuction } from './auctions.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

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

  app.post(
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
}
