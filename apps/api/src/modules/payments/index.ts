import {
  AdminPaymentBaseSchema,
  AdminPaymentListQuerystringSchema,
  AdminPaymentListSchema,
  BankAccountIdSchema,
  CardIdSchema,
  CircleBlockchainAddressSchema,
  CreateBankAccountResponseSchema,
  CreateBankAccountSchema,
  CreateCardSchema,
  CreatePaymentCardSchema,
  CreatePaymentSchema,
  CreateTransferPaymentSchema,
  CreateWalletAddressSchema,
  CurrencySchema,
  FindTransferByAddressSchema,
  GetPaymentBankAccountStatusSchema,
  GetPaymentCardStatusSchema,
  OwnerExternalIdSchema,
  PaymentBankAccountInstructionsSchema,
  PaymentCardsSchema,
  PaymentIdSchema,
  PaymentSchema,
  PublicKeySchema,
  SendBankAccountInstructionsSchema,
  ToPaymentBaseSchema,
  UpdatePaymentCardSchema,
  UpdatePaymentSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'
import fastifyBearerAuth from 'fastify-bearer-auth'

import {
  createBankAccount,
  createCard,
  createPayment,
  createTransferPayment,
  createWalletAddress,
  findTransferByAddress,
  findWirePaymentsByBankId,
  getAdminPaymentById,
  getBankAccountStatus,
  getCards,
  getCardStatus,
  getCurrency,
  getPaymentById,
  getPayments,
  getPublicKey,
  getWireTransferInstructions,
  removeCard,
  sendWireTransferInstructions,
  updateCard,
  updatePayment,
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
    .get(
      '/',
      {
        schema: {
          tags,
          security,
          querystring: AdminPaymentListQuerystringSchema,
          response: {
            200: AdminPaymentListSchema,
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
          response: {
            200: PaymentSchema,
          },
        },
      },
      getPaymentById
    )
    .get(
      '/:paymentId/admin',
      {
        schema: {
          tags,
          security,
          params: PaymentIdSchema,
          response: {
            200: AdminPaymentBaseSchema,
          },
        },
      },
      getAdminPaymentById
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
      '/bank-accounts/:bankAccountId/status',
      {
        schema: {
          tags,
          security,
          params: BankAccountIdSchema,
          response: {
            200: GetPaymentBankAccountStatusSchema,
          },
        },
      },
      getBankAccountStatus
    )
    .get(
      '/bank-accounts/send',
      {
        schema: {
          tags,
          security,
          querystring: SendBankAccountInstructionsSchema,
          response: {
            204: Type.Null(),
          },
        },
      },
      sendWireTransferInstructions
    )
    .get(
      '/bank-accounts/:bankAccountId/instructions',
      {
        schema: {
          tags,
          security,
          params: BankAccountIdSchema,
          response: {
            200: PaymentBankAccountInstructionsSchema,
          },
        },
      },
      getWireTransferInstructions
    )
    .get(
      '/bank-accounts/:bankAccountId/payments',
      {
        schema: {
          tags,
          security,
          params: BankAccountIdSchema,
          response: {
            200: Type.Array(PaymentSchema),
          },
        },
      },
      findWirePaymentsByBankId
    )
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
    .patch(
      '/:paymentId',
      {
        schema: {
          tags,
          security,
          params: PaymentIdSchema,
          body: UpdatePaymentSchema,
          response: {
            201: PaymentSchema,
          },
        },
      },
      updatePayment
    )
    .post(
      '/transfers',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: CreateTransferPaymentSchema,
          response: {
            201: PaymentSchema,
          },
        },
      },
      createTransferPayment
    )
    .get(
      '/transfers',
      {
        schema: {
          tags,
          security,
          querystring: FindTransferByAddressSchema,
          response: {
            200: ToPaymentBaseSchema,
          },
        },
      },
      findTransferByAddress
    )
    .post(
      '/bank-accounts',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: CreateBankAccountSchema,
          response: {
            201: CreateBankAccountResponseSchema,
          },
        },
      },
      createBankAccount
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
    .post(
      '/wallets',
      {
        transact: true,
        schema: {
          tags,
          security,
          body: CreateWalletAddressSchema,
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
