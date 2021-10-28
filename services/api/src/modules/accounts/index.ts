import {
  CreateUserAccountRequestSchema,
  ExternalIdSchema,
  PassphraseSchema,
  PublicUserAccountSchema,
  UpdateUserAccountSchema,
  UsernameSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import {
  createAccount,
  getByExternalId,
  getByUsername,
  updateAccount,
  verifyPassphrase,
  verifyUsername,
} from './accounts.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function accountsRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['accounts']
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
    .post(
      '/',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: CreateUserAccountRequestSchema,
          response: {
            201: PublicUserAccountSchema,
          },
        },
      },
      createAccount
    )
    .get(
      '/',
      {
        schema: {
          tags,
          security,
          querystring: UsernameSchema,
          response: {
            200: PublicUserAccountSchema,
          },
        },
      },
      getByUsername
    )
    .get(
      '/:externalId',
      {
        schema: {
          tags,
          security,
          params: ExternalIdSchema,
          response: {
            200: PublicUserAccountSchema,
          },
        },
      },
      getByExternalId
    )
    .patch(
      '/:externalId',
      {
        transact: true,
        schema: {
          tags,
          security,
          params: ExternalIdSchema,
          body: UpdateUserAccountSchema,
          response: {
            204: Type.Null(),
          },
        },
      },
      updateAccount
    )
    .post(
      '/:externalId/verify-passphrase',
      {
        schema: {
          tags,
          security,
          params: ExternalIdSchema,
          body: PassphraseSchema,
          response: {
            204: Type.Null(),
          },
        },
      },
      verifyPassphrase
    )
    .post(
      '/verify-username',
      {
        schema: {
          tags,
          security,
          body: UsernameSchema,
          response: {
            200: Type.Object({ isAvailable: Type.Boolean() }),
          },
        },
      },
      verifyUsername
    )
}
