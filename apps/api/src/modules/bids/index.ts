import { CreateBidRequestSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import fastifyBearerAuth from '@fastify/bearer-auth'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import { createBid } from './bids.routes'

export async function bidsRoutes(app: FastifyInstance) {
  const tags = ['bids']
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
    '/pack',
    {
      transact: true,
      schema: {
        tags,
        security,
        body: CreateBidRequestSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    createBid
  )
}
