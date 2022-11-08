import { Static, Type } from '@sinclair/typebox'

import {
  CircleCreateIBANWireBankAccountSchema,
  CircleCreateOtherWireBankAccountSchema,
  CircleCreateUSWireBankAccountSchema,
  CircleIBANWireBankAddressSchema,
  CircleOtherWireBankAddressSchema,
  CircleUSWireBankAddressSchema,
  CircleWireBankAccountBaseSchema,
  CircleWireBankAccountStatus,
} from './circle'
import { BaseSchema, IdSchema, Simplify } from './shared'

const CreateWireBankAccountBaseSchema = Type.Object({
  isSaved: Type.Boolean(),
  default: Type.Boolean(),
})

export const CreateIBANWireBankAccountSchema = Type.Intersect([
  Type.Omit(CircleCreateIBANWireBankAccountSchema, ['idempotencyKey']),
  CreateWireBankAccountBaseSchema,
])

export const CreateUSWireBankAccountSchema = Type.Intersect([
  Type.Omit(CircleCreateUSWireBankAccountSchema, ['idempotencyKey']),
  CreateWireBankAccountBaseSchema,
])

export const CreateOtherWireBankAccountSchema = Type.Intersect([
  Type.Omit(CircleCreateOtherWireBankAccountSchema, ['idempotencyKey']),
  CreateWireBankAccountBaseSchema,
])

const WireBankAccountCircleFields = Type.Omit(CircleWireBankAccountBaseSchema, [
  'id',
  'createDate',
  'updateDate',
])

export const WireBankAccountBaseSchema = Type.Intersect([
  BaseSchema,
  WireBankAccountCircleFields,
  CreateWireBankAccountBaseSchema,
  Type.Object({ externalId: Type.Union([Type.String(), Type.Null()]) }),
])

export const IBANWireBankAccountSchema = Type.Intersect([
  WireBankAccountBaseSchema,
  Type.Object({
    iban: Type.String(),
    bankAddress: CircleIBANWireBankAddressSchema,
  }),
])

export const USWireBankAccountSchema = Type.Intersect([
  WireBankAccountBaseSchema,
  Type.Object({
    accountNumber: Type.String(),
    routingNumber: Type.String(),
    bankAddress: CircleUSWireBankAddressSchema,
  }),
])

export const OtherWireBankAccountSchema = Type.Intersect([
  WireBankAccountBaseSchema,
  Type.Object({
    accountNumber: Type.String(),
    routingNumber: Type.String(),
    bankAddress: CircleOtherWireBankAddressSchema,
  }),
])

export const WireBankAccountSchema = Type.Union([
  IBANWireBankAccountSchema,
  USWireBankAccountSchema,
  OtherWireBankAccountSchema,
])

export const WireBankAccountIdParamsSchema = Type.Object({
  wireBankAccountId: IdSchema,
})

export const WireBankAccountStatusInfoSchema = Type.Object({
  status: Type.Enum(CircleWireBankAccountStatus),
})

export const PatchWireBankAccountSchema = Type.Object({
  default: Type.Boolean(),
})

export const WireBankAccountsSchema = Type.Array(WireBankAccountSchema)

export type CreateIBANWireBankAccountRequest = Simplify<
  Static<typeof CreateIBANWireBankAccountSchema>
>

export type IBANWireBankAccount = Simplify<
  Static<typeof IBANWireBankAccountSchema>
>

export type CreateUSWireBankAccountRequest = Simplify<
  Static<typeof CreateUSWireBankAccountSchema>
>

export type USWireBankAccount = Simplify<Static<typeof USWireBankAccountSchema>>

export type CreateOtherWireBankAccountRequest = Simplify<
  Static<typeof CreateOtherWireBankAccountSchema>
>

export type OtherWireBankAccount = Simplify<
  Static<typeof OtherWireBankAccountSchema>
>

export type CreateWireBankAccountRequest =
  | CreateIBANWireBankAccountRequest
  | CreateUSWireBankAccountRequest
  | CreateOtherWireBankAccountRequest

export type WireBankAccountIdParams = Simplify<
  Static<typeof WireBankAccountIdParamsSchema>
>

export type PatchWireBankAccount = Simplify<
  Static<typeof PatchWireBankAccountSchema>
>
