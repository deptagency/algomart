import {
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
  PaymentQuerystringSchema,
  PaymentSchema,
  PaymentsQuerystringSchema,
  PaymentsSchema,
  PublicKeySchema,
  SendBankAccountInstructionsSchema,
  ToPaymentBaseSchema,
  UpdatePaymentCardSchema,
  UpdatePaymentSchema,
  WirePaymentSchema,
} from '@algomart/schemas'
import { appErrorHandler } from '@algomart/shared/utils'
import bearerAuthOptions from '@api/configuration/bearer-auth'
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
            200: Type.Array(WirePaymentSchema),
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
