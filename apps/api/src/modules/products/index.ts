import {
  ProductQuerySchema,
  ProductsSchema,
} from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import { searchProducts } from './products.routes'

export async function productsRoutes(app: FastifyInstance) {
  const tags = ['products']
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
    '/search',
    {
      schema: {
        tags,
        security,
        description: 'Search all products with pagination.',
        querystring: ProductQuerySchema,
        response: {
          200: ProductsSchema,
        },
      },
    },
    searchProducts
  )
}
