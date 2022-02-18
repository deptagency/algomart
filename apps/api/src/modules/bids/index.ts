import { CreateBidRequestSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import bearerAuthOptions from '../../configuration/bearer-auth'

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
