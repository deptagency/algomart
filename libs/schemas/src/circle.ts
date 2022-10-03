import { Static, Type } from '@sinclair/typebox'

import {
  AlgorandAccountAddressSchema,
  Base64Schema,
  CirclePayoutDestinationType,
  CirclePayoutStatus,
  CirclePriceSchema,
  CircleTransferStatus,
  CircleWalletIdSchema,
  CountryCodeSchema,
  CurrencyCodeSchema,
  IdSchema,
  Nullable,
  PostalCodeSchema,
  Simplify,
} from './shared'

// #region enums

export enum CirclePaymentCardNetwork {
  VISA = 'VISA',
  MASTERCARD = 'MASTERCARD',
  AMEX = 'AMEX',
  UNKNOWN = 'UNKNOWN',
}

export enum CircleVerificationAVSSuccessCode {
  D = 'D',
  F = 'F',
  M = 'M',
  S = 'S',
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

export enum CircleVerificationThreeDSecureStatus {
  Pass = 'pass',
  Fail = 'fail',
}

export enum CirclePaymentVerificationOptions {
  none = 'none',
  cvv = 'cvv',
  three_d_secure = 'three_d_secure',
}

export enum CircleNotificationSubscriptionStatus {
  confirmed = 'confirmed',
  pending = 'pending',
  deleted = 'deleted',
}

// You can see descriptions for these errors at https://developers.circle.com/docs/entity-errors

export enum CirclePaymentErrorCode {
  account_ineligible = 'account_ineligible',
  account_name_mismatch = 'account_name_mismatch',
  account_number_mismatch = 'account_number_mismatch',
  bank_account_ineligible = 'bank_account_ineligible',
  bank_transaction_error = 'bank_transaction_error',
  card_account_ineligible = 'card_account_ineligible',
  card_cvv_invalid = 'card_cvv_invalid',
  card_expired = 'card_expired',
  card_failed = 'card_failed',
  card_invalid = 'card_invalid',
  card_limit_violated = 'card_limit_violated',
  card_not_honored = 'card_not_honored',
  card_restricted = 'card_restricted',
  customer_name_mismatch = 'customer_name_mismatch',
  institution_name_mismatch = 'institution_name_mismatch',
  invalid_account_number = 'invalid_account_number',
  invalid_ach_rtn = 'invalid_ach_rtn',
  invalid_wire_rtn = 'invalid_wire_rtn',
  payment_canceled = 'payment_canceled',
  payment_denied = 'payment_denied',
  payment_failed = 'payment_failed',
  payment_failed_balance_check = 'payment_failed_balance_check',
  payment_fraud_detected = 'payment_fraud_detected',
  payment_not_funded = 'payment_not_funded',
  payment_not_supported_by_issuer = 'payment_not_supported_by_issuer',
  payment_returned = 'payment_returned',
  payment_stopped_by_issuer = 'payment_stopped_by_issuer',
  payment_unprocessable = 'payment_unprocessable',
  reference_id_invalid = 'ref_id_invalid',
  unauthorized_transaction = 'unauthorized_transaction',
  wallet_address_mismatch = 'wallet_address_mismatch',
  three_d_secure_action_expired = 'three_d_secure_action_expired',
  three_d_secure_failure = 'three_d_secure_failure',
  three_d_secure_invalid_request = 'three_d_secure_invalid_request',
  three_d_secure_not_supported = 'three_d_secure_not_supported',
  three_d_secure_required = 'three_d_secure_required',
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
  risk_denied = 'risk_denied',
  verification_failed = 'verification_failed',
  verification_fraud_detected = 'verification_fraud_detected',
  verification_not_supported_by_issuer = 'verification_not_supported_by_issuer',
  verification_stopped_by_issuer = 'verification_stopped_by_issuer',
}

export enum CircleTransferErrorCode {
  insufficient_funds = 'insufficient_funds',
  blockchain_error = 'blockchain_error',
  transfer_denied = 'transfer_denied',
  transfer_failed = 'transfer_failed',
}

export enum CirclePayoutErrorCode {
  insufficient_funds = 'insufficient_funds',
  transaction_denied = 'transaction_denied',
  transaction_failed = 'transaction_failed',
  transaction_returned = 'transaction_returned',
  bank_transaction_error = 'bank_transaction_error',
  fiat_account_limit_exceeded = 'fiat_account_limit_exceeded',
  invalid_bank_account_number = 'invalid_bank_account_number',
  invalid_ach_rtn = 'invalid_ach_rtn',
  invalid_wire_rtn = 'invalid_wire_rtn',
  vendor_inactive = 'vendor_inactive',
}

export enum CirclePaymentStatus {
  ActionRequired = 'action_required',
  Confirmed = 'confirmed',
  Failed = 'failed',
  Paid = 'paid',
  Pending = 'pending',
}

export enum CircleWireBankAccountStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum CircleCardStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum CirclePaymentSourceType {
  card = 'card',
  ach = 'ach',
  sepa = 'sepa',
  wire = 'wire',
}

export enum CirclePayoutSourceType {
  ach = 'ach',
  sepa = 'sepa',
  wire = 'wire',
}

export enum CircleTransferSourceType {
  wallet = 'wallet',
  blockchain = 'blockchain',
}

export enum CircleTransferDestinationType {
  blockchain = 'blockchain',
}

export enum CircleTransferChainType {
  ALGO = 'ALGO',
  AVAX = 'AVAX',
  BTC = 'BTC',
  ETH = 'ETH',
  FLOW = 'FLOW',
  HBAR = 'HBAR',
  MATIC = 'MATIC',
  SOL = 'SOL',
  TRX = 'TRX',
  XLM = 'XLM',
}

export enum CircleTransferCurrencyType {
  USD = 'USD',
}

export enum CirclePaymentCancelReason {
  duplicate = 'duplicate',
  fraudulent = 'fraudulent',
  requested_by_customer = 'requested_by_customer',
  bank_transaction_error = 'bank_transaction_error',
  invalid_account_number = 'invalid_account_number',
  insufficient_funds = 'insufficient_funds',
  payment_stopped_by_issuer = 'payment_stopped_by_issuer',
  payment_returned = 'payment_returned',
  bank_account_ineligible = 'bank_account_ineligible',
  invalid_ach_rtn = 'invalid_ach_rtn',
  unauthorized_transaction = 'unauthorized_transaction',
  payment_failed = 'payment_failed',
}

// #endregion enums

// #region schemas

export const CircleRiskEvaluationSchema = Type.Object({
  decision: Type.String(),
  reason: Type.String(),
})

const CircleVerificationAVSCode = Type.Union([
  Type.Enum(CircleVerificationAVSCodeOptions),
  Type.Enum(CircleVerificationAVSSuccessCode),
  Type.Enum(CircleVerificationAVSFailureCode),
])

const CircleBillingDetailsSchema = Type.Object({
  // We rely on Circle to validate these
  // Question is if we want to add some of our own too?
  name: Type.String(),
  city: Type.String(),
  country: CountryCodeSchema,
  line1: Type.String(),
  line2: Type.Optional(Type.String()),
  district: Type.Optional(Type.String()),
  postalCode: PostalCodeSchema,
})

const CircleMetadataSchema = Type.Object({
  // Note that Circle also accepts a phone number, but we do not collect that.
  email: Type.String({ format: 'email' }),
  // Technically this should be a base64 encoded hash, but old cards have used UUIDs...
  sessionId: Type.Optional(Nullable(Type.Union([Base64Schema, IdSchema]))),
  ipAddress: Type.Optional(
    Type.Union([
      Type.String({ format: 'ipv4' }),
      Type.String({ format: 'ipv6' }),
    ])
  ),
})

export const CircleMoneyObjectSchema = Type.Object({
  // Always a string representing USD with two decimal places ex. 3.14
  amount: CirclePriceSchema,
  // Only supports USD
  // https://developers.circle.com/docs/circle-api-resources#money-object
  currency: CurrencyCodeSchema,
})

export const CircleAdjustmentsSchema = Type.Object({
  fxCredit: CircleMoneyObjectSchema,
  fxDebit: CircleMoneyObjectSchema,
})

export const CircleBlockchainAddressSchema = Type.Object({
  // We rely on Circle to validate these
  // Question is if we want to add some of our own too?
  address: Type.String(),
  addressTag: Type.Optional(Type.String()),
  currency: Type.String(),
  chain: Type.String(),
})

const CircleCreateBlockchainAddressSchema = Type.Object({
  idempotencyKey: IdSchema,
  walletId: CircleWalletIdSchema,
})

export const CircleCreateCardSchema = Type.Object({
  idempotencyKey: IdSchema,
  // We rely on Circle to validate the keyId
  // Question is if we want to add some of our own too?
  keyId: Type.String(),
  encryptedData: Base64Schema,
  billingDetails: CircleBillingDetailsSchema,
  expMonth: Type.Integer({ minimum: 1, maximum: 12 }),
  expYear: Type.Integer({ minimum: 2000, maximum: 2100 }),
  metadata: CircleMetadataSchema,
})

const CircleBankAddressBaseSchema = Type.Object({
  line1: Type.Optional(Type.String()),
  line2: Type.Optional(Type.String()),
  district: Type.Optional(Type.String()),
})

export const CircleIBANWireBankAddressSchema = Type.Intersect([
  CircleBankAddressBaseSchema,
  Type.Object({
    bankName: Type.Optional(Type.String()),
    city: Type.String(),
    country: CountryCodeSchema,
  }),
])

export const CircleUSWireBankAddressSchema = Type.Intersect([
  CircleBankAddressBaseSchema,
  Type.Object({
    bankName: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    country: CountryCodeSchema,
  }),
])

export const CircleOtherWireBankAddressSchema = Type.Intersect([
  CircleBankAddressBaseSchema,
  Type.Object({
    bankName: Type.String(),
    city: Type.String(),
    country: CountryCodeSchema,
  }),
])

export const CircleBankAddressSchema = Type.Union([
  CircleUSWireBankAddressSchema,
  CircleIBANWireBankAddressSchema,
  CircleOtherWireBankAddressSchema,
])

export const CircleCreateWireBankAccountBaseSchema = Type.Object({
  idempotencyKey: IdSchema,
  billingDetails: CircleBillingDetailsSchema,
})

export const CircleCreateIBANWireBankAccountSchema = Type.Intersect([
  CircleCreateWireBankAccountBaseSchema,
  Type.Object({
    iban: Type.String(),
    bankAddress: CircleIBANWireBankAddressSchema,
  }),
])

export const CircleCreateUSWireBankAccountSchema = Type.Intersect([
  CircleCreateWireBankAccountBaseSchema,
  Type.Object({
    accountNumber: Type.String(),
    routingNumber: Type.String(),
    bankAddress: CircleUSWireBankAddressSchema,
  }),
])

export const CircleCreateOtherWireBankAccountSchema = Type.Intersect([
  CircleCreateWireBankAccountBaseSchema,
  Type.Object({
    accountNumber: Type.String(),
    routingNumber: Type.String(),
    bankAddress: CircleOtherWireBankAddressSchema,
  }),
])

export const CircleCreateWireBankAccountSchema = Type.Union([
  CircleCreateIBANWireBankAccountSchema,
  CircleCreateUSWireBankAccountSchema,
  CircleCreateOtherWireBankAccountSchema,
])

export const CircleWireBankAccountBaseSchema = Type.Object({
  id: Type.String(),
  status: Type.Enum(CircleWireBankAccountStatus),
  description: Type.Union([Type.String(), Type.Null()]),
  trackingRef: Type.Union([Type.String(), Type.Null()]),
  fingerprint: Type.Union([Type.String(), Type.Null()]),
  billingDetails: CircleBillingDetailsSchema,
  createDate: Type.String({ format: 'date-time' }),
  updateDate: Type.String({ format: 'date-time' }),
  riskEvaluation: Type.Optional(
    Type.Union([CircleRiskEvaluationSchema, Type.Null()])
  ),
})

export const CircleIBANWireBankAccountSchema = Type.Intersect([
  CircleWireBankAccountBaseSchema,
  Type.Object({
    bankAddress: CircleIBANWireBankAddressSchema,
  }),
])

export const CircleUSWireBankAccountSchema = Type.Intersect([
  CircleWireBankAccountBaseSchema,
  Type.Object({
    bankAddress: CircleUSWireBankAddressSchema,
  }),
])

export const CircleOtherWireBankAccountSchema = Type.Intersect([
  CircleWireBankAccountBaseSchema,
  Type.Object({
    bankAddress: CircleOtherWireBankAddressSchema,
  }),
])

export const CircleWireBankAccountSchema = Type.Union([
  CircleIBANWireBankAccountSchema,
  CircleUSWireBankAccountSchema,
  CircleOtherWireBankAccountSchema,
])

const CirclePaymentSourceSchema = Type.Object({
  id: IdSchema,
  type: Type.Enum(CirclePaymentSourceType),
})

export const CircleCreatePaymentSchema = Type.Object({
  idempotencyKey: IdSchema,
  // We rely on Circle to validate the keyId
  // Question is if we want to add some of our own too?
  keyId: Type.Optional(Type.String()),
  metadata: CircleMetadataSchema,
  amount: CircleMoneyObjectSchema,
  verification: Type.Enum(CirclePaymentVerificationOptions),
  verificationSuccessUrl: Type.Optional(Type.String({ format: 'uri' })),
  verificationFailureUrl: Type.Optional(Type.String({ format: 'uri' })),
  source: CirclePaymentSourceSchema,
  description: Type.String(),
  encryptedData: Type.Optional(Type.String()),
})

const CircleCreateWalletSchema = Type.Object({
  idempotencyKey: IdSchema,
  description: Type.Optional(Type.String()),
})

const BaseCircleCreateWalletTransfer = Type.Object({
  source: Type.Object({
    type: Type.Enum(CircleTransferSourceType),
    id: CircleWalletIdSchema,
  }),
  destination: Type.Object({
    type: Type.Enum(CircleTransferSourceType),
    id: CircleWalletIdSchema,
  }),
  amount: CircleMoneyObjectSchema,
})

const CircleCreateWalletTransferRequestSchema = Type.Intersect([
  BaseCircleCreateWalletTransfer,
  Type.Object({
    idempotencyKey: IdSchema,
  }),
])

const BaseCircleCreateWalletTransferPayout = Type.Object({
  source: Type.Object({
    type: Type.Enum(CircleTransferSourceType),
    id: CircleWalletIdSchema,
  }),
  destination: Type.Object({
    type: Type.Enum(CircleTransferDestinationType),
    chain: Type.Enum(CircleTransferChainType),
    address: AlgorandAccountAddressSchema,
  }),
  amount: CircleMoneyObjectSchema,
})

const CircleCreateWalletTransferPayoutRequestSchema = Type.Intersect([
  BaseCircleCreateWalletTransferPayout,
  Type.Object({
    idempotencyKey: IdSchema,
  }),
])

const CircleCreateWalletTransferResponseSchema = Type.Intersect([
  BaseCircleCreateWalletTransfer,
  Type.Object({
    id: IdSchema,
    transactionHash: Type.String(),
    status: Type.Enum(CircleTransferStatus),
    errorCode: Type.Enum(CircleTransferErrorCode),
    createDate: Type.String({ format: 'date-time' }),
  }),
])

const CirclePaymentVerificationSchema = Type.Object({
  avs: Type.Optional(CircleVerificationAVSCode),
  cvv: Type.Optional(Type.Enum(CircleVerificationCvvStatus)),
  three_d_secure: Type.Optional(
    Type.Enum(CircleVerificationThreeDSecureStatus)
  ),
})

const CircleCardVerificationSchema = Type.Object({
  avs: CircleVerificationAVSCode,
  cvv: Type.Enum(CircleVerificationCvvStatus),
})

const CircleRequiredActionSchema = Type.Object({
  type: Type.String(),
  redirectUrl: Type.String({ format: 'uri' }),
})

const CirclePaymentOriginalPaymentSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  amount: CircleMoneyObjectSchema,
  description: Type.Optional(Type.String()),
  status: Type.Enum(CirclePaymentStatus),
  requiredAction: CircleRequiredActionSchema,
  fees: CircleMoneyObjectSchema,
  createDate: Type.String({ format: 'date-time' }),
})

const CircleErrorResponseSchema = Type.Object({
  code: Type.Number(),
  example: Type.String(),
  message: Type.String(),
})

const CirclePaymentSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  merchantId: Type.String(),
  merchantWalletId: CircleWalletIdSchema,
  amount: CircleMoneyObjectSchema,
  source: CirclePaymentSourceSchema,
  description: Type.Optional(Type.String()),
  status: Type.Enum(CirclePaymentStatus),
  verification: CirclePaymentVerificationSchema,
  fees: CircleMoneyObjectSchema,
  createDate: Type.String({ format: 'date-time' }),
  updateDate: Type.String({ format: 'date-time' }),
})

const CirclePaymentCancelSchema = Type.Intersect([
  CirclePaymentSchema,
  Type.Object({
    originalPayment: CirclePaymentOriginalPaymentSchema,
  }),
])

export const CircleCardSchema = Type.Object({
  id: Type.String(),
  status: Type.Enum(CircleCardStatus),
  billingDetails: CircleBillingDetailsSchema,
  expMonth: Type.Integer({ minimum: 1, maximum: 12 }),
  expYear: Type.Integer({ minimum: 2000, maximum: 2100 }),
  network: Type.Enum(CirclePaymentCardNetwork),
  last4: Type.String({ pattern: '^[0-9]{4}$', minLength: 4, maxLength: 4 }),
  fingerprint: Type.String(),
  bin: Type.String(),
  issuerCountry: CountryCodeSchema,
  errorCode: Type.Optional(Type.Enum(CircleCardErrorCode)),
  verification: CircleCardVerificationSchema,
  riskEvaluation: Type.Optional(CircleRiskEvaluationSchema),
  metadata: CircleMetadataSchema,
  createDate: Type.String({ format: 'date-time' }),
  updateDate: Type.String({ format: 'date-time' }),
})

const CirclePublicKeySchema = Type.Object({
  keyId: Type.String(),
  publicKey: Type.String(),
})

const CirclePaymentResponseSchema = Type.Intersect([
  CirclePaymentSchema,
  Type.Object({
    requiredAction: CircleRequiredActionSchema,
    verification: CirclePaymentVerificationSchema,
    cancel: Type.Optional(CirclePaymentCancelSchema),
    refunds: Type.Array(
      Type.Intersect([
        CirclePaymentCancelSchema,
        Type.Object({
          cancel: Type.Object({
            id: Type.String(),
            type: Type.String(),
            description: Type.Optional(Type.String()),
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

const CircleSourceSchema = Type.Object({
  type: Type.String(),
  id: Type.Optional(Type.String()),
  address: Type.Optional(Type.String()),
  chain: Type.Optional(Type.Enum(CircleTransferChainType)),
})

const CircleTransferSchema = Type.Object({
  id: IdSchema,
  source: CircleSourceSchema,
  destination: Type.Object({
    type: Type.String(),
    address: Type.String(),
    addressTag: Type.Optional(Type.String()),
    chain: Type.String(),
  }),
  amount: CircleMoneyObjectSchema,
  transactionHash: Type.Optional(Type.String()),
  status: Type.Enum(CircleTransferStatus),
  errorCode: Type.Optional(Type.Enum(CircleTransferErrorCode)),
  createDate: Type.String(),
})

export const CircleReturnSchema = Type.Object({
  id: IdSchema,
  payoutId: IdSchema,
  status: Type.Enum(CirclePayoutStatus),
  amount: CircleMoneyObjectSchema,
  fees: CircleMoneyObjectSchema,
  reason: Type.String(),
  createDate: Type.String({ format: 'date-time' }),
  updateDate: Type.String({ format: 'date-time' }),
})

export const CirclePayoutDestinationSchema = Type.Object({
  id: IdSchema,
  type: Type.Enum(CirclePayoutDestinationType),
  name: Type.Optional(Type.String()),
})

export const CircleCreateWirePayoutRequestSchema = Type.Object({
  idempotencyKey: IdSchema,
  source: CircleSourceSchema,
  destination: CirclePayoutDestinationSchema,
  amount: CircleMoneyObjectSchema,
  metadata: Type.Object({
    beneficiaryEmail: Type.String({ format: 'email' }),
  }),
})

const CirclePayoutSchema = Type.Object({
  id: IdSchema,
  sourceWalletId: Type.String(),
  destination: CirclePayoutDestinationSchema,
  amount: CircleMoneyObjectSchema,
  status: Type.Enum(CirclePayoutStatus),
  fees: Type.Optional(CircleMoneyObjectSchema),
  trackingRef: Type.Optional(Type.String()),
  externalRef: Type.Optional(Type.String()),
  riskEvaluation: Type.Optional(CircleRiskEvaluationSchema),
  adjustments: Type.Optional(CircleAdjustmentsSchema),
  return: Type.Optional(CircleReturnSchema),
  errorCode: Type.Optional(Type.Enum(CirclePayoutErrorCode)),
  createDate: Type.String({ format: 'date-time' }),
  updateDate: Type.String({ format: 'date-time' }),
})

const CircleWalletSchema = Type.Object({
  walletId: Type.String(),
  entityId: IdSchema,
  type: Type.String(),
  description: Type.Optional(Type.String()),
  balances: Type.Optional(
    Type.Array(
      Type.Object({
        amount: Type.Optional(Type.String()),
        currency: Type.Optional(Type.String()),
      })
    )
  ),
})

const CircleTransferQuerySchema = Type.Object({
  from: Type.Optional(Type.String({ type: 'date-time' })),
  to: Type.Optional(Type.String({ type: 'date-time' })),
  pageBefore: Type.Optional(Type.String()),
  pageAfter: Type.Optional(Type.String()),
  pageSize: Type.Optional(Type.Number()),
  destinationWalletId: Type.Optional(Type.String()),
})

export const CircleNotificationSubscriptionSchema = Type.Object({
  id: IdSchema,
  endpoint: Type.String({ format: 'uri' }),
  subscriptionDetails: Type.Array(
    Type.Object({
      url: Type.String({ format: 'uri' }),
      status: Type.Enum(CircleNotificationSubscriptionStatus),
    })
  ),
})

export const CircleSettlementSchema = Type.Object({
  id: IdSchema,
  merchantWalletId: Type.Optional(Type.String()),
  walletId: Type.Optional(Type.String()),
  totalDebits: Type.Optional(CircleMoneyObjectSchema),
  totalCredits: Type.Optional(CircleMoneyObjectSchema),
  paymentFees: Type.Optional(CircleMoneyObjectSchema),
  chargebackFees: Type.Optional(CircleMoneyObjectSchema),
  createDate: Type.String({ format: 'date-time' }),
  updateDate: Type.String({ format: 'date-time' }),
})

export const CircleWireInstructionsSchema = Type.Object({
  trackingRef: Type.String(),
  beneficiary: Type.Object({
    name: Type.String(),
    address1: Type.String(),
    address2: Type.String(),
  }),
  beneficiaryBank: Type.Object({
    name: Type.String(),
    address: Type.String(),
    city: Type.String(),
    postalCode: Type.String(),
    country: Type.String(),
    swiftCode: Type.String(),
    routingNumber: Type.String(),
    accountNumber: Type.String(),
    currency: Type.String(),
  }),
})

// #endregion schemas

// #region types
export type CircleRiskEvaluation = Simplify<
  Static<typeof CircleRiskEvaluationSchema>
>
export type CircleBlockchainAddress = Simplify<
  Static<typeof CircleBlockchainAddressSchema>
>
export type CircleCard = Simplify<Static<typeof CircleCardSchema>>
export type CircleCardVerification = Simplify<
  Static<typeof CircleCardVerificationSchema>
>
export type CircleCreateBlockchainAddress = Simplify<
  Static<typeof CircleCreateBlockchainAddressSchema>
>

export type CircleBillingDetails = Simplify<
  Static<typeof CircleBillingDetailsSchema>
>

export type CircleCreateCard = Simplify<Static<typeof CircleCreateCardSchema>>
export type CircleCreatePayment = Simplify<
  Static<typeof CircleCreatePaymentSchema>
>
export type CircleCreateWallet = Simplify<
  Static<typeof CircleCreateWalletSchema>
>
export type CircleCreateWalletTransferRequest = Simplify<
  Static<typeof CircleCreateWalletTransferRequestSchema>
>
export type CircleCreateWalletTransferPayoutRequest = Simplify<
  Static<typeof CircleCreateWalletTransferPayoutRequestSchema>
>
export type CircleCreateWalletTransferResponse = Simplify<
  Static<typeof CircleCreateWalletTransferResponseSchema>
>
export type CircleErrorResponse = Simplify<
  Static<typeof CircleErrorResponseSchema>
>

export type CirclePaymentResponse = Simplify<
  Static<typeof CirclePaymentResponseSchema>
>
export type CirclePaymentVerification = Simplify<
  Static<typeof CirclePaymentVerificationSchema>
>
export type CirclePublicKey = Simplify<Static<typeof CirclePublicKeySchema>>
export type CircleTransfer = Simplify<Static<typeof CircleTransferSchema>>
export type CircleTransferQuery = Simplify<
  Static<typeof CircleTransferQuerySchema>
>
export type CircleWallet = Simplify<Static<typeof CircleWalletSchema>>
export type CircleNotificationSubscription = Simplify<
  Static<typeof CircleNotificationSubscriptionSchema>
>
export type CircleSettlement = Simplify<Static<typeof CircleSettlementSchema>>

export type CircleIBANWireBankAddress = Simplify<
  Static<typeof CircleIBANWireBankAddressSchema>
>
export type CircleUSWireBankAddress = Simplify<
  Static<typeof CircleUSWireBankAddressSchema>
>
export type CircleOtherWireBankAddress = Simplify<
  Static<typeof CircleOtherWireBankAddressSchema>
>
export type CircleBankAddress = Simplify<Static<typeof CircleBankAddressSchema>>

export type CircleCreateIBANWireBankAccountRequest = Simplify<
  Static<typeof CircleCreateIBANWireBankAccountSchema>
>
export type CircleCreateUSWireBankAccountRequest = Simplify<
  Static<typeof CircleCreateUSWireBankAccountSchema>
>
export type CircleCreateOtherWireBankAccountRequest = Simplify<
  Static<typeof CircleCreateOtherWireBankAccountSchema>
>
export type CircleCreateWireBankAccountRequest = Simplify<
  Static<typeof CircleCreateWireBankAccountSchema>
>
export type CircleIBANWireBankAccount = Simplify<
  Static<typeof CircleIBANWireBankAccountSchema>
>
export type CircleUSWireBankAccount = Simplify<
  Static<typeof CircleUSWireBankAccountSchema>
>
export type CircleOtherWireBankAccount = Simplify<
  Static<typeof CircleOtherWireBankAccountSchema>
>
export type CircleWireBankAccount = Simplify<
  Static<typeof CircleWireBankAccountSchema>
>
export type CircleWireInstructions = Simplify<
  Static<typeof CircleWireInstructionsSchema>
>

export type CircleCreateWirePayoutRequest = Simplify<
  Static<typeof CircleCreateWirePayoutRequestSchema>
>
export type CirclePayoutDestination = Simplify<
  Static<typeof CirclePayoutDestinationSchema>
>
export type CirclePayout = Simplify<Static<typeof CirclePayoutSchema>>
export type CircleReturn = Simplify<Static<typeof CircleReturnSchema>>
export type CircleAdjustments = Simplify<Static<typeof CircleAdjustmentsSchema>>
export type CircleMoneyObject = Simplify<Static<typeof CircleMoneyObjectSchema>>

// #endregion types

// #region utils

export interface CircleSuccessResponse<T = unknown> {
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

// #endregion utils
