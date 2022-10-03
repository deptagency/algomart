import {
  CircleWireInstructionsSchema,
  CreateIBANWireBankAccountSchema,
  CreateOtherWireBankAccountSchema,
  CreateUSWireBankAccountSchema,
  IBANWireBankAccountSchema,
  OtherWireBankAccountSchema,
  PatchWireBankAccountSchema,
  USWireBankAccountSchema,
  WireBankAccountIdParamsSchema,
  WireBankAccountsSchema,
  WireBankAccountStatusInfoSchema,
} from '@algomart/schemas'
import { Type } from '@sinclair/typebox'
import { FastifyInstance } from 'fastify'

import {
  createWireBankAccount,
  getSavedWireBankAccounts,
  getWireBankAccountStatus,
  getWireInstructionsForBankAccount,
  removeWireBankAccount,
  updateWireBankAccount,
} from './wires.routes'

export async function wiresRoutes(app: FastifyInstance) {
  // Helps with organization in the Swagger docs
  const tags = ['wires']
  const security = [
    {
      'Firebase Token': [],
    },
  ]

  // Hooks
  app.addHook('preHandler', app.requireAuth())

  // Services/Routes
  app.post(
    '/bank-accounts/iban',
    {
      schema: {
        tags,
        security,
        body: CreateIBANWireBankAccountSchema,
        response: {
          201: IBANWireBankAccountSchema,
        },
      },
    },
    createWireBankAccount
  )

  app.post(
    '/bank-accounts/us',
    {
      schema: {
        tags,
        security,
        body: CreateUSWireBankAccountSchema,
        response: {
          201: USWireBankAccountSchema,
        },
      },
    },
    createWireBankAccount
  )

  app.post(
    '/bank-accounts/other',
    {
      schema: {
        tags,
        security,
        body: CreateOtherWireBankAccountSchema,
        response: {
          201: OtherWireBankAccountSchema,
        },
      },
    },
    createWireBankAccount
  )

  app.patch(
    '/bank-accounts/:wireBankAccountId',
    {
      schema: {
        tags,
        security,
        params: WireBankAccountIdParamsSchema,
        body: PatchWireBankAccountSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    updateWireBankAccount
  )

  app.get(
    '/bank-accounts',
    {
      schema: {
        tags,
        security,
        response: {
          200: WireBankAccountsSchema,
        },
      },
    },
    getSavedWireBankAccounts
  )

  app.get(
    '/bank-accounts/:wireBankAccountId/status',
    {
      schema: {
        tags,
        security,
        params: WireBankAccountIdParamsSchema,
        response: {
          200: WireBankAccountStatusInfoSchema,
        },
      },
    },
    getWireBankAccountStatus
  )

  app.delete(
    '/bank-accounts/:wireBankAccountId',
    {
      schema: {
        tags,
        security,
        params: WireBankAccountIdParamsSchema,
        response: {
          204: Type.Null(),
        },
      },
    },
    removeWireBankAccount
  )

  app.get(
    '/bank-accounts/:wireBankAccountId/instructions',
    {
      schema: {
        tags,
        security,
        params: WireBankAccountIdParamsSchema,
        response: {
          200: CircleWireInstructionsSchema,
        },
      },
    },
    getWireInstructionsForBankAccount
  )
}
