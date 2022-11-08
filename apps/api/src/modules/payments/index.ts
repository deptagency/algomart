import {
  CardIdSchema,
  CircleBlockchainAddressSchema,
  CreateCardSchema,
  CreateCcPaymentSchema,
  CreateUsdcPaymentSchema,
  GetPaymentCardStatusSchema,
  GetPaymentsMissingTransfersResponseSchema,
  PaymentCardSchema,
  PaymentCardsSchema,
  PaymentIdSchema,
  PaymentQuerystringSchema,
  PaymentSchema,
  PaymentsQuerystringSchema,
  PaymentsSchema,
  PublicKeySchema,
  PurchasePackWithCreditsSchema,
  UpdatePaymentCardSchema,
  UserAccountTransferSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  createCard,
  createCcPayment,
  createUsdcPayment,
  createWalletAddress,
  findTransferByPaymentId,
  getCards,
  getCardStatus,
  getPaymentById,
  getPayments,
  getPaymentsMissingTransfers,
  getPublicKey,
  purchasePackWithCredits,
  removeCard,
  updateCard,
} from './payments.routes'

export async function paymentRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['payments']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes
  app
    .get(
      '/',
      {
        schema: {
          tags,
          security,
          querystring: PaymentsQuerystringSchema,
          response: {
            200: PaymentsSchema,
          },
        },
      },
      getPayments
    )
    .get(
      '/:paymentId',
      {
        schema: {
          tags,
          security,
          params: PaymentIdSchema,
          querystring: PaymentQuerystringSchema,
          response: {
            200: PaymentSchema,
          },
        },
      },
      getPaymentById
    )
    .get(
      '/missing-transfers',
      {
        schema: {
          tags,
          security,
          response: {
            200: GetPaymentsMissingTransfersResponseSchema,
          },
        },
      },
      getPaymentsMissingTransfers
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
    .get(
      '/:paymentId/transfer',
      {
        schema: {
          tags,
          security,
          params: PaymentIdSchema,
          response: {
            200: UserAccountTransferSchema,
          },
        },
      },
      findTransferByPaymentId
    )
    .post(
      '/cc-payment',
      {
        config: {
          rateLimit: {},
        },
        schema: {
          tags,
          security,
          body: CreateCcPaymentSchema,
          response: {
            201: PaymentSchema,
          },
        },
      },
      createCcPayment
    )
    .post(
      '/usdc-payment',
      {
        schema: {
          tags,
          security,
          body: CreateUsdcPaymentSchema,
          response: {
            201: PaymentSchema,
          },
        },
      },
      createUsdcPayment
    )
    .post(
      '/purchase-pack-with-credits',
      {
        config: {
          rateLimit: {},
        },
        schema: {
          tags,
          security,
          body: PurchasePackWithCreditsSchema,
          response: {
            201: UserAccountTransferSchema,
          },
        },
      },
      purchasePackWithCredits
    )
    .post(
      '/cards',
      {
        config: {
          rateLimit: {},
        },
        schema: {
          tags,
          security,
          body: CreateCardSchema,
          response: {
            201: PaymentCardSchema,
          },
        },
      },
      createCard
    )
    .post(
      '/wallets',
      {
        schema: {
          tags,
          security,
          response: {
            201: CircleBlockchainAddressSchema,
          },
        },
      },
      createWalletAddress
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
          response: {
            200: PaymentCardsSchema,
          },
        },
      },
      getCards
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
