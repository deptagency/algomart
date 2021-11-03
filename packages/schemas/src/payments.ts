import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, Nullable, Simplify } from './shared'

// Enums

export enum CircleVerificationAVSSuccessCode {
  D = 'D',
  F = 'F',
  M = 'M',
  X = 'X',
  Y = 'Y',
}

export enum CircleVerificationAVSFailureCode {
  A = 'A',
  B = 'B',
  C = 'C',
  E = 'E',
  G = 'G',
  I = 'I',
  K = 'K',
  L = 'L',
  N = 'N',
  O = 'O',
  P = 'P',
  R = 'R',
  S = 'S',
  U = 'U',
  W = 'W',
  Z = 'Z',
  '-' = '-',
}

export enum CircleVerificationAVSCodeOptions {
  not_requested = 'not_requested',
  pending = 'pending',
}

export enum CircleVerificationCvvStatus {
  NotRequested = 'not_requested',
  Pass = 'pass',
  Fail = 'fail',
  Unavailable = 'unavailable',
  Pending = 'pending',
}

export enum CirclePaymentVerificationOptions {
  none = 'none',
  cvv = 'cvv',
}

export enum CirclePaymentErrorCode {
  payment_failed = 'payment_failed',
  payment_fraud_detected = 'payment_fraud_detected',
  payment_denied = 'payment_denied',
  payment_not_supported_by_issuer = 'payment_not_supported_by_issuer',
  payment_not_funded = 'payment_not_funded',
  payment_unprocessable = 'payment_unprocessable',
  payment_stopped_by_issuer = 'payment_stopped_by_issuer',
  payment_canceled = 'payment_canceled',
  payment_returned = 'payment_returned',
  payment_failed_balance_check = 'payment_failed_balance_check',
  card_failed = 'card_failed',
  card_invalid = 'card_invalid',
  card_address_mismatch = 'card_address_mismatch',
  card_zip_mismatch = 'card_zip_mismatch',
  card_cvv_invalid = 'card_cvv_invalid',
  card_expired = 'card_expired',
  card_limit_violated = 'card_limit_violated',
  card_not_honored = 'card_not_honored',
  card_cvv_required = 'card_cvv_required',
  credit_card_not_allowed = 'credit_card_not_allowed',
  card_account_ineligible = 'card_account_ineligible',
  unauthorized_transaction = 'unauthorized_transaction',
  bank_account_ineligible = 'bank_account_ineligible',
  bank_transaction_error = 'bank_transaction_error',
  invalid_account_number = 'invalid_account_number',
  invalid_wire_rtn = 'invalid_wire_rtn',
  invalid_ach_rtn = 'invalid_ach_rtn',
}

export enum CircleCardErrorCode {
  card_account_ineligible = 'card_account_ineligible',
  card_address_mismatch = 'card_address_mismatch',
  card_cvv_invalid = 'card_cvv_invalid',
  card_cvv_required = 'card_cvv_required',
  card_expired = 'card_expired',
  card_failed = 'card_failed',
  card_invalid = 'card_invalid',
  card_limit_violated = 'card_limit_violated',
  card_not_honored = 'card_not_honored',
  card_zip_mismatch = 'card_zip_mismatch',
  credit_card_not_allowed = 'credit_card_not_allowed',
  verification_denied = 'verification_denied',
  verification_failed = 'verification_failed',
  verification_fraud_detected = 'verification_fraud_detected',
  verification_not_supported_by_issuer = 'verification_not_supported_by_issuer',
  verification_stopped_by_issuer = 'verification_stopped_by_issuer',
}

export enum CirclePaymentStatus {
  Pending = 'pending',
  Failed = 'failed',
  Confirmed = 'confirmed',
  Paid = 'paid',
}

export enum CircleCardStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum PaymentStatus {
  Pending = 'pending',
  Failed = 'failed',
  Confirmed = 'confirmed',
  Paid = 'paid',
}

export enum PaymentCardStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
  Inactive = 'inactive',
}

export enum CirclePaymentSourceType {
  card = 'card',
  ach = 'ach',
}

// Schemas

const ToPaymentCardBaseSchema = Type.Object({
  expirationMonth: Type.Optional(Type.String()),
  expirationYear: Type.Optional(Type.String()),
  externalId: Type.String({ format: 'uuid' }),
  ownerExternalId: Type.Optional(Type.String()),
  network: Type.String(),
  lastFour: Type.String(),
  status: Type.Optional(Type.Enum(PaymentCardStatus)),
  error: Type.Optional(Type.Enum(CircleCardErrorCode)),
})

const ToPaymentBaseSchema = Type.Object({
  externalId: Type.String({ format: 'uuid' }),
  status: Type.Optional(Type.Enum(PaymentStatus)),
  error: Type.Optional(Type.Enum(CirclePaymentErrorCode)),
})

const PaymentBaseSchema = Type.Object({
  packId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
  payerId: Type.String(),
  paymentCardId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
})

const PaymentCardBaseSchema = Type.Intersect([
  ToPaymentCardBaseSchema,
  Type.Object({
    default: Type.Boolean(),
  }),
])

const PaymentRequiredActionSchema = Type.Object({
  type: Type.String(),
  redirectUrl: Type.String(),
})

// Circle

const CircleVerificationAVSCode = Type.Intersect([
  Type.Enum(CircleVerificationAVSCodeOptions),
  Type.Enum(CircleVerificationAVSSuccessCode),
  Type.Enum(CircleVerificationAVSFailureCode),
])

const CircleBillingDetailsSchema = Type.Object({
  name: Type.String(),
  city: Type.String(),
  country: Type.String(),
  line1: Type.String(),
  line2: Type.Optional(Type.String({ nullable: true })),
  district: Type.Optional(Type.String({ nullable: true })),
  postalCode: Type.String(),
})

const CircleMetadataSchema = Type.Object({
  email: Type.String(),
  phoneNumber: Type.Optional(Type.String({ nullable: true })),
  sessionId: Type.Optional(Type.String()),
  ipAddress: Type.Optional(Type.String()),
})

const CircleCreateCardSchema = Type.Object({
  idempotencyKey: Type.String({ type: 'uuid' }),
  keyId: Type.String(),
  encryptedData: Type.String(),
  billingDetails: CircleBillingDetailsSchema,
  expMonth: Type.Number({ min: 1, max: 12 }),
  expYear: Type.Number({ min: 2000 }),
  metadata: CircleMetadataSchema,
})

const CirclePaymentAmountSchema = Type.Object({
  amount: Type.String(),
  currency: Type.String(),
})

const CirclePaymentSourceSchema = Type.Object({
  id: Type.String({ type: 'uuid' }),
  type: Type.Enum(CirclePaymentSourceType),
})

const CircleCreatePaymentSchema = Type.Object({
  idempotencyKey: Type.String({ type: 'uuid' }),
  keyId: Type.Optional(Type.String({ nullable: true })),
  metadata: CircleMetadataSchema,
  amount: CirclePaymentAmountSchema,
  verification: Type.Enum(CirclePaymentVerificationOptions),
  source: CirclePaymentSourceSchema,
  description: Type.Optional(Type.String({ nullable: true })),
  encryptedData: Type.Optional(Type.String({ nullable: true })),
})

const CirclePaymentVerificationSchema = Type.Object({
  avs: CircleVerificationAVSCode,
  cvv: Type.Enum(CircleVerificationCvvStatus),
  three_d_secure: Type.String(),
})

const CircleCardVerificationSchema = Type.Object({
  avs: CircleVerificationAVSCode,
  cvv: Type.Enum(CircleVerificationCvvStatus),
})

const CircleRiskEvaluationSchema = Type.Object({
  decision: Type.String(),
  reason: Type.String(),
})

const CirclePaymentOriginalPaymentSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  amount: CirclePaymentAmountSchema,
  description: Type.Optional(Type.String({ nullable: true })),
  status: Type.Enum(CirclePaymentStatus),
  requiredAction: PaymentRequiredActionSchema,
  fees: CirclePaymentAmountSchema,
  createDate: Type.String(),
})

const CircleErrorResponseSchema = Type.Object({
  code: Type.Number(),
  example: Type.String(),
})

const CirclePaymentSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  merchantId: Type.String(),
  merchantWalletId: Type.String(),
  amount: CirclePaymentAmountSchema,
  source: CirclePaymentSourceSchema,
  description: Type.Optional(Type.String({ nullable: true })),
  status: Type.Enum(CirclePaymentStatus),
  verification: CirclePaymentVerificationSchema,
  fees: CirclePaymentAmountSchema,
  createDate: Type.String(),
  updateDate: Type.String(),
})

const CirclePaymentCancelSchema = Type.Intersect([
  CirclePaymentSchema,
  Type.Object({
    originalPayment: CirclePaymentOriginalPaymentSchema,
  }),
])

const CircleCardSchema = Type.Object({
  id: Type.String(),
  status: Type.Enum(CircleCardStatus),
  billingDetails: CircleBillingDetailsSchema,
  expMonth: Type.Number(),
  expYear: Type.Number(),
  network: Type.String(),
  last4: Type.String(),
  fingerprint: Type.String(),
  bin: Type.String(),
  issuerCountry: Type.String(),
  errorCode: Type.Optional(Type.Enum(CircleCardErrorCode)),
  verification: CircleCardVerificationSchema,
  riskEvaluation: Type.Optional(CircleRiskEvaluationSchema),
  metadata: CircleMetadataSchema,
  createDate: Type.String(),
  updateDate: Type.String(),
})

const CirclePublicKeySchema = Type.Object({
  keyId: Type.String(),
  publicKey: Type.String(),
})

const CirclePaymentResponseSchema = Type.Intersect([
  CirclePaymentSchema,
  Type.Object({
    requiredAction: PaymentRequiredActionSchema,
    verification: CirclePaymentVerificationSchema,
    cancel: Type.Optional(CirclePaymentCancelSchema),
    refunds: Type.Array(
      Type.Intersect([
        CirclePaymentCancelSchema,
        Type.Object({
          cancel: Type.Object({
            id: Type.String(),
            type: Type.String(),
            description: Type.Optional(Type.String({ nullable: true })),
            status: Type.Enum(CirclePaymentStatus),
            createDate: Type.String(),
          }),
        }),
      ])
    ),
    trackingRef: Type.String(),
    errorCode: Type.Optional(Type.Enum(CirclePaymentErrorCode)),
    metadata: CircleMetadataSchema,
    riskEvaluation: Type.Optional(CircleRiskEvaluationSchema),
  }),
])

// Coinbase

const CoinbaseExchangeRatesOptionsSchema = Type.Object({
  currency: Type.String(),
})

const CoinbaseExchangeRatesSchema = Type.Object({
  currency: Type.String(),
  rates: Type.Object({}),
})

const CoinbaseErrorResponseSchema = Type.Object({
  errors: Type.Array(
    Type.Object({
      id: Type.String(),
      message: Type.String(),
    })
  ),
})

// Payment/card routes schemas

export const CurrencySchema = Type.Object({
  base: Type.Number(),
  code: Type.String(),
  exponent: Type.Number(),
})

export const GetPaymentCardStatusSchema = Type.Object({
  status: Type.Optional(Type.Enum(PaymentCardStatus)),
})

export const PaymentSchema = Type.Intersect([
  BaseSchema,
  PaymentBaseSchema,
  ToPaymentBaseSchema,
])

export const PaymentIdSchema = Type.Object({
  paymentId: Type.String(),
})

export const PaymentCardSchema = Type.Intersect([
  BaseSchema,
  PaymentCardBaseSchema,
])

export const PaymentCardsSchema = Type.Array(PaymentCardSchema)

export const PaymentCardNoSaveSchema = Type.Object({
  externalId: Type.String(),
  status: Type.Enum(CircleCardStatus),
})

export const CardIdSchema = Type.Object({
  cardId: Type.String({ format: 'uuid' }),
})

export const CreateCardSchema = Type.Intersect([
  Type.Omit(CircleCreateCardSchema, ['expMonth', 'expYear']),
  Type.Object({
    id: Type.Optional(Type.String({ format: 'uuid' })),
    expirationMonth: Type.Number(),
    expirationYear: Type.Number(),
    saveCard: Type.Optional(Type.Boolean()),
    ownerExternalId: Type.String(),
    default: Type.Optional(Type.Boolean()),
  }),
])

export const CreatePaymentCardSchema = Type.Union([
  PaymentCardSchema,
  PaymentCardNoSaveSchema,
])

export const CreatePaymentSchema = Type.Intersect([
  Type.Omit(CircleCreatePaymentSchema, ['source', 'amount']),
  Type.Omit(ToPaymentBaseSchema, ['externalId']),
  Type.Omit(PaymentBaseSchema, ['payerId']),
  Type.Object({
    cardId: Type.String(),
    packTemplateId: Type.String({ format: 'uuid' }),
    payerExternalId: Type.String(),
  }),
])

export const PublicKeySchema = Type.Object({
  keyId: Type.String(),
  publicKey: Type.String(),
})

export const UpdatePaymentCardSchema = Type.Object({
  default: Type.Boolean(),
  ownerExternalId: Type.String(),
})

// Types

export type CardId = Simplify<Static<typeof CardIdSchema>>
export type CheckoutStatus =
  | 'passphrase'
  | 'form'
  | 'loading'
  | 'success'
  | 'error'
export type CircleCard = Simplify<Static<typeof CircleCardSchema>>
export type CircleCardVerification = Simplify<
  Static<typeof CircleCardVerificationSchema>
>
export type CircleCreateCard = Simplify<Static<typeof CircleCreateCardSchema>>
export type CircleCreatePayment = Simplify<
  Static<typeof CircleCreatePaymentSchema>
>
export type CircleErrorResponse = Simplify<
  Static<typeof CircleErrorResponseSchema>
>
export type CirclePaymentAmount = Simplify<
  Static<typeof CirclePaymentAmountSchema>
>
export type CirclePaymentResponse = Simplify<
  Static<typeof CirclePaymentResponseSchema>
>
export type CirclePaymentVerification = Simplify<
  Static<typeof CirclePaymentVerificationSchema>
>
export type CirclePublicKey = Simplify<Static<typeof CirclePublicKeySchema>>
export type CoinbaseExchangeRatesOptions = Simplify<
  Static<typeof CoinbaseExchangeRatesOptionsSchema>
>
export type CoinbaseExchangeRates = Simplify<
  Static<typeof CoinbaseExchangeRatesSchema>
>
export type CoinbaseErrorResponse = Simplify<
  Static<typeof CoinbaseErrorResponseSchema>
>
export type CreateCard = Simplify<Static<typeof CreateCardSchema>>
export type CreatePayment = Simplify<Static<typeof CreatePaymentSchema>>
export type CreatePaymentCard = Simplify<Static<typeof CreatePaymentCardSchema>>
export type Currency = Simplify<Static<typeof CurrencySchema>>
export type GetPaymentCardStatus = Simplify<
  Static<typeof GetPaymentCardStatusSchema>
>
export type Payment = Simplify<Static<typeof PaymentSchema>>
export type PaymentId = Simplify<Static<typeof PaymentIdSchema>>
export type PaymentCard = Simplify<Static<typeof PaymentCardSchema>>
export type PaymentCards = Simplify<Static<typeof PaymentCardsSchema>>
export type PublicKey = Simplify<Static<typeof PublicKeySchema>>
export type ToPaymentBase = Simplify<Static<typeof ToPaymentBaseSchema>>
export type ToPaymentCardBase = Simplify<Static<typeof ToPaymentCardBaseSchema>>
export type UpdatePaymentCard = Simplify<Static<typeof UpdatePaymentCardSchema>>

// Success/error response

interface CircleSuccessResponse<T = unknown> {
  data: T
}

export type CircleResponse<T = unknown> =
  | CircleSuccessResponse<T>
  | CircleErrorResponse

export function isCircleSuccessResponse<T = unknown>(
  response: CircleResponse<T>
): response is CircleSuccessResponse<T> {
  const { data } = response as CircleSuccessResponse<T>
  return !!data
}

interface CoinbaseSuccessResponse<T = unknown> {
  data: T
}

export type CoinbaseResponse<T = unknown> =
  | CoinbaseSuccessResponse<T>
  | CoinbaseErrorResponse

export function isCoinbaseSuccessResponse<T = unknown>(
  response: CoinbaseResponse<T>
): response is CoinbaseSuccessResponse<T> {
  const { data } = response as CoinbaseSuccessResponse<T>
  return !!data
}
