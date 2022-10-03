import { OnfidoWebhookEventSchema } from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import { handleCircleWebhook, processRequestOnfido } from './webhooks.routes'

export async function webhookRoutes(app: FastifyInstance) {
  const tags = ['webhook']

  // Services/Routes
  app.post(
    '/onfido',
    {
      schema: {
        tags,
        body: OnfidoWebhookEventSchema,
        description: 'handle onfido webhooks',
        response: {
          200: Type.Null(),
        },
      },
    },
    processRequestOnfido
  )

  // #region Circle

  app.post(
    '/circle',
    {
      schema: {
        tags,
        description: 'Circle webhook handler',
        // Do not validate payload with a JSON schema.
        // Instead, we rely on the sns-validator module to do it for us
      },
    },
    handleCircleWebhook
  )

  // #endregion Circle
}
