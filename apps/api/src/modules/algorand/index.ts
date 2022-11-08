import {
  AlgorandAccountAddressObjectSchema,
  AlgorandAssetIndexParameterSchema,
  AlgorandSendRawTransactionParamsSchema,
  AlgorandTransactionParameterSchema,
  AlgorandTransactionSuggestedParamsSchema,
  AlgorandTransformedAccountInfoSchema,
  AlgorandTransformedAssetInfoSchema,
  AlgorandTransformedTransactionInfoSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  getTransactionParams,
  lookupAccount,
  lookupAsset,
  lookupTransaction,
  sendRawTransaction,
} from './algorand.routes'

export async function algorandRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['algorand']

  app
    .get(
      '/lookup-account',
      {
        schema: {
          tags,
          querystring: AlgorandAccountAddressObjectSchema,
          response: {
            200: AlgorandTransformedAccountInfoSchema,
          },
        },
      },
      lookupAccount
    )
    .get(
      '/lookup-asset',
      {
        schema: {
          tags,
          querystring: AlgorandAssetIndexParameterSchema,
          response: {
            200: AlgorandTransformedAssetInfoSchema,
          },
        },
      },
      lookupAsset
    )
    .get(
      '/lookup-transaction',
      {
        schema: {
          tags,
          querystring: AlgorandTransactionParameterSchema,
          response: {
            200: AlgorandTransformedTransactionInfoSchema,
          },
        },
      },
      lookupTransaction
    )
    .get(
      '/get-transaction-params',
      {
        schema: {
          tags,
          response: {
            200: AlgorandTransactionSuggestedParamsSchema,
          },
        },
      },
      getTransactionParams
    )
    .post(
      '/send-raw-transaction',
      {
        schema: {
          tags,
          body: AlgorandSendRawTransactionParamsSchema,
          response: {
            200: Type.String(),
          },
        },
      },
      sendRawTransaction
    )
}
