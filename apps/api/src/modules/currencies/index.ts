import {
  CurrencyConversionListSchema,
  CurrencyConversionSchema,
} from '@algomart/schemas'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import {
  getCurrencyConversion,
  getCurrencyConversions,
} from './currencies.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function currenciesRoutes(app: FastifyInstance) {
  const tags = ['collections']
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
      '/getCurrencyConversion',
      {
        schema: {
          tags,
          security,
          response: {
            200: CurrencyConversionSchema,
          },
        },
      },
      getCurrencyConversion
    )
    .get(
      '/getCurrencyConversions',
      {
        schema: {
          tags,
          security,
          response: {
            200: CurrencyConversionListSchema,
          },
        },
      },
      getCurrencyConversions
    )
}
