import { DirectusWebhookSchema } from '@algomart/schemas'
import { processRequestDirectus } from '@scribe/modules/webhooks/webhooks.routes'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

export async function webhookRoutes(app: FastifyInstance) {
  const tags = ['webhook']
  const security = [
    {
      'API Key': [],
    },
  ]

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
    processRequestDirectus
  )
}
