import {
  CircleNotificationSubscriptionSchema,
  CreateCircleWebhookBodySchema,
  UserAccountsSchema,
  UsersVerificationQuerystringSchema,
  WebhookModelSchema,
} from '@algomart/schemas'
import bearerAuthOptions from '@api/configuration/bearer-auth'
import fastifyBearerAuth from '@fastify/bearer-auth'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  createCircleWebhook,
  deleteCircleWebhook,
  getCircleWebhook,
  getUsersByVerificationStatus,
} from './admin.routes'

export async function adminRoutes(app: FastifyInstance) {
  const tags = ['admin']
  const security = [
    {
      'API Key': [],
    },
  ]

  // Plugins
  await app.register(fastifyBearerAuth, bearerAuthOptions)

  // Services/Routes
  app.get(
    '/accounts/verified',
    {
      schema: {
        tags,
        security,
        querystring: UsersVerificationQuerystringSchema,
        response: {
          200: UserAccountsSchema,
        },
      },
    },
    getUsersByVerificationStatus
  )

  app.post(
    '/webhooks/circle/configure',
    {
      schema: {
        tags,
        security,
        description: 'Create a webhook for Circle',
        body: CreateCircleWebhookBodySchema,
        response: {
          201: WebhookModelSchema,
        },
      },
    },
    createCircleWebhook
  )

  app.get(
    '/webhooks/circle/configure',
    {
      schema: {
        tags,
        security,
        description: 'Get the webhook for Circle',
        response: {
          200: Type.Object({
            webhook: WebhookModelSchema,
            subscription: CircleNotificationSubscriptionSchema,
          }),
        },
      },
    },
    getCircleWebhook
  )

  app.delete(
    '/webhooks/circle/configure',
    {
      schema: {
        tags,
        security,
        description: 'Delete the webhook for Circle',
        response: {
          204: Type.Null(),
        },
      },
    },
    deleteCircleWebhook
  )
}
