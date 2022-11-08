import { Static, Type } from '@sinclair/typebox'

import {
  CircleCreateWirePayoutRequestSchema,
  CircleMoneyObjectSchema,
  CirclePayoutDestinationSchema,
  CirclePayoutErrorCode,
  CircleReturnSchema,
  CircleRiskEvaluationSchema,
} from './circle'
import {
  AlgorandAccountAddressSchema,
  BaseSchema,
  CirclePayoutStatus,
  IdSchema,
  Nullable,
  Simplify,
} from './shared'

// Enums, Constants
// ----------------------------------------------------
export const MIN_PAYOUT_AMOUNT_CENTS = 500
export const WIRE_PAYOUT_FEE_AMOUNT_CENTS = 2500

// Type Schemas
const CircleWirePayoutFieldsSchema = Type.Object({
  sourceWalletId: Type.Optional(Nullable(Type.String())),
  destination: Type.Optional(Nullable(CirclePayoutDestinationSchema)),
  amount: Type.Optional(Nullable(CircleMoneyObjectSchema)),
  status: Type.Optional(Nullable(Type.Enum(CirclePayoutStatus))),
  fees: Type.Optional(Nullable(CircleMoneyObjectSchema)),
  trackingRef: Type.Optional(Nullable(Type.String())),
  externalRef: Type.Optional(Nullable(Type.String())),
  riskEvaluation: Type.Optional(Nullable(CircleRiskEvaluationSchema)),
  return: Type.Optional(Nullable(CircleReturnSchema)),
  error: Type.Optional(Nullable(Type.Enum(CirclePayoutErrorCode))),
})
const PayoutBaseSchema = Type.Object({
  userId: IdSchema,
  destinationAddress: Type.Optional(Nullable(AlgorandAccountAddressSchema)),
})
const WirePayoutBaseSchema = Type.Object({
  userId: IdSchema,
  wireBankAccountId: IdSchema,
  createPayload: CircleCreateWirePayoutRequestSchema,
  externalId: Type.Optional(Nullable(IdSchema)),
})
export const PayoutSchema = Type.Intersect([PayoutBaseSchema, BaseSchema])
export const WirePayoutSchema = Type.Intersect([
  BaseSchema,
  WirePayoutBaseSchema,
  CircleWirePayoutFieldsSchema,
])
export const CircleWirePayoutPublicDetailsSchema = Type.Object({
  destinationName: Type.Optional(Nullable(Type.String())),
  status: Type.Optional(Nullable(Type.Enum(CirclePayoutStatus))),
  fees: Type.Optional(Nullable(CircleMoneyObjectSchema)),
  trackingRef: Type.Optional(Nullable(Type.String())),
  externalRef: Type.Optional(Nullable(Type.String())),
  return: Type.Optional(Nullable(CircleReturnSchema)),
})

// Request Schemas
// ----------------------------------------------------
export const BalanceAvailableForPayoutResponseSchema = Type.Object({
  availableBalance: Type.Integer(),
})
export const InitiateUsdcPayoutRequestSchema = Type.Object({
  amount: Type.String({ pattern: '^[1-9][0-9]+$' }),
  destinationAddress: AlgorandAccountAddressSchema,
})
export const InitiateWirePayoutRequestSchema = Type.Object({
  amount: Type.String({ pattern: '^[1-9][0-9]+$' }),
  wireBankAccountId: IdSchema,
})

// Type exports
// ----------------------------------------------------
export type BalanceAvailableForPayoutResponse = Simplify<
  Static<typeof BalanceAvailableForPayoutResponseSchema>
>
export type InitiateUsdcPayoutRequest = Simplify<
  Static<typeof InitiateUsdcPayoutRequestSchema>
>
export type InitiateWirePayoutRequest = Simplify<
  Static<typeof InitiateWirePayoutRequestSchema>
>
export type Payout = Simplify<Static<typeof PayoutSchema>>
export type WirePayout = Simplify<Static<typeof WirePayoutSchema>>
export type CircleWirePayoutPublicDetails = Simplify<
  Static<typeof CircleWirePayoutPublicDetailsSchema>
>
