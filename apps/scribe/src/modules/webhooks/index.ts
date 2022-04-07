import { Type } from '@sinclair/typebox'
import { DirectusWebhookSchema } from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import { FastifyInstance } from 'fastify'
import { processRequest } from './webhooks.routes'

export async function webhookRoutes(app: FastifyInstance) {
  const tags = ['webhook']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Errors
  app.setErrorHandler(appErrorHandler(app))

  // Plugins

  // Services/Routes
  app.post(
    '/directus',
    {
      schema: {
        tags,
        security,
        body: DirectusWebhookSchema,
        description: 'handle directus webhooks',
        response: {
          200: Type.Null(),
        },
      },
    },
    processRequest
  )
}
