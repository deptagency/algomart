import { FaqsSchema, LocaleSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import bearerAuthOptions from '../../configuration/bearer-auth'

import { getFaqs } from './faqs.routes'

export async function faqsRoutes(app: FastifyInstance) {
  const tags = ['faqs']
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
    '/',
    {
      schema: {
        tags,
        security,
        querystring: LocaleSchema,
      },
    },
    getFaqs
  )
}
