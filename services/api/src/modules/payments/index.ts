import {
  CardIdSchema,
  CreateCardSchema,
  CreatePaymentCardSchema,
  CreatePaymentSchema,
  CurrencySchema,
  GetPaymentCardStatusSchema,
  OwnerExternalIdSchema,
  PaymentCardsSchema,
  PaymentIdSchema,
  PaymentSchema,
  PublicKeySchema,
  UpdatePaymentCardSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import {
  createCard,
  createPayment,
  getCards,
  getCardStatus,
  getCurrency,
  getPaymentById,
  getPublicKey,
  removeCard,
  updateCard,
} from './payments.routes'

import bearerAuthOptions from '@/configuration/bearer-auth'
import { appErrorHandler } from '@/utils/errors'

export async function paymentRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['payments']
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
          body: CreatePaymentSchema,
          response: {
            201: PaymentSchema,
          },
        },
      },
      createPayment
    )
    .get(
      '/:paymentId',
      {
        schema: {
          tags,
          security,
          params: PaymentIdSchema,
          response: {
            200: PaymentSchema,
          },
        },
      },
      getPaymentById
    )
    .get(
      '/encryption-public-key',
      {
        schema: {
          tags,
          security,
          response: {
            200: PublicKeySchema,
          },
        },
      },
      getPublicKey
    )
    .get(
      '/cards/:cardId/status',
      {
        schema: {
          tags,
          security,
          params: CardIdSchema,
          response: {
            200: GetPaymentCardStatusSchema,
          },
        },
      },
      getCardStatus
    )
    .post(
      '/cards',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: CreateCardSchema,
          response: {
            201: CreatePaymentCardSchema,
          },
        },
      },
      createCard
    )
    .patch(
      '/cards/:cardId',
      {
        schema: {
          tags,
          security,
          params: CardIdSchema,
          body: UpdatePaymentCardSchema,
          response: {
            204: Type.Null(),
          },
        },
      },
      updateCard
    )
    .get(
      '/cards',
      {
        schema: {
          tags,
          security,
          querystring: OwnerExternalIdSchema,
          response: {
            200: PaymentCardsSchema,
          },
        },
      },
      getCards
    )
    .get(
      '/currency',
      {
        schema: {
          tags,
          security,
          response: {
            200: CurrencySchema,
          },
        },
      },
      getCurrency
    )
    .delete(
      '/cards/:cardId',
      {
        schema: {
          tags,
          security,
          params: CardIdSchema,
          response: {
            204: Type.Null(),
          },
        },
      },
      removeCard
    )
}
