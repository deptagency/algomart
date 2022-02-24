import { Static, Type } from '@sinclair/typebox'

import { UserAccountSchema } from './accounts'
import { PackBaseSchema, PackSchema } from './packs'
import {
  BaseSchema,
  IdSchema,
  Nullable,
  PaginationSchema,
  Simplify,
  SortDirection,
} from './shared'

// #region Enums

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

export enum CircleVerificationThreeDSecureStatus {
  Pass = 'pass',
  Fail = 'fail',
}

export enum CirclePaymentVerificationOptions {
  none = 'none',
  cvv = 'cvv',
  three_d_secure = 'three_d_secure',
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

export enum CirclePaymentStatus {
  Pending = 'pending',
  Failed = 'failed',
  Confirmed = 'confirmed',
  ActionRequired = 'action_required',
  Paid = 'paid',
}

export enum CircleBankAccountStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum CircleCardStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum CircleTransferStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum PaymentStatus {
  Pending = 'pending',
  Failed = 'failed',
  Confirmed = 'confirmed',
  ActionRequired = 'action_required',
  Paid = 'paid',
}

export enum PaymentCardStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
  Inactive = 'inactive',
}

export enum PaymentBankAccountStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
  Inactive = 'inactive',
}

export enum CirclePaymentSourceType {
  card = 'card',
  ach = 'ach',
  sepa = 'sepa',
  wire = 'wire',
}

export enum CircleTransferSourceType {
  wallet = 'wallet',
}

export enum CirclePaymentQueryType {
  card = 'card',
  ach = 'ach',
  sepa = 'sepa',
  wire = 'wire',
}

export enum CheckoutMethod {
  card = 'card',
  wire = 'wire',
  crypto = 'crypto',
}

export enum CheckoutStatus {
  passphrase = 'passphrase',
  form = 'form',
  loading = 'loading',
  success = 'success',
  error = 'error',
  summary = 'summary',
}

export enum PaymentSortField {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Status = 'status',
}

// #endregion
// #region Schemas

const ToPaymentBankAccountBaseSchema = Type.Object({
  externalId: Type.String({ format: 'uuid' }),
  description: Type.String(),
  status: Type.Enum(PaymentBankAccountStatus),
})

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

export const ToPaymentBaseSchema = Type.Object({
  externalId: Type.String({ format: 'uuid' }),
  status: Type.Optional(Type.Enum(PaymentStatus)),
  error: Type.Optional(
    Type.Union([
      Type.Enum(CirclePaymentErrorCode),
      Type.Enum(CircleTransferErrorCode),
    ])
  ),
  amount: Type.String(),
  action: Type.Optional(Type.String({ format: 'uri' })),
  sourceId: Type.Optional(Type.String()),
})

const PaymentBaseSchema = Type.Object({
  packId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
  payerId: Type.String(),
  paymentCardId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
  paymentBankId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
  destinationAddress: Type.Optional(Nullable(Type.String())),
  transferId: Type.Optional(Nullable(Type.String())),
})

const PaymentBankAccountBaseSchema = Type.Intersect([
  BaseSchema,
  ToPaymentBankAccountBaseSchema,
  Type.Object({
    amount: Type.Number(),
  }),
])

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

export const FindTransferByAddressSchema = Type.Object({
  destinationAddress: Type.String(),
})

export const SendBankAccountInstructionsSchema = Type.Object({
  bankAccountId: IdSchema,
  ownerExternalId: Type.String(),
})
// #endregion
// #region Circle

const CircleVerificationAVSCode = Type.Union([
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

const CircleBankAddressSchema = Type.Object({
  bankName: Type.Optional(Type.String()),
  city: Type.Optional(Type.String()),
  country: Type.String(),
  line1: Type.Optional(Type.String()),
  line2: Type.Optional(Type.String()),
  district: Type.Optional(Type.String()),
})

const CircleMetadataSchema = Type.Object({
  email: Type.String(),
  phoneNumber: Type.Optional(Type.String({ nullable: true })),
  sessionId: Type.Optional(Type.String()),
  ipAddress: Type.Optional(Type.String()),
})

export const CircleBlockchainAddressSchema = Type.Object({
  address: Type.String(),
  addressTag: Type.Optional(Type.String()),
  currency: Type.String(),
  chain: Type.String(),
})

const CircleCreateBlockchainAddressSchema = Type.Object({
  idempotencyKey: Type.String({ type: 'uuid' }),
  walletId: Type.String(),
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

const CircleCreateBankAccountSchema = Type.Object({
  idempotencyKey: Type.String({ type: 'uuid' }),
  accountNumber: Type.String(),
  routingNumber: Type.String(),
  billingDetails: CircleBillingDetailsSchema,
  bankAddress: CircleBankAddressSchema,
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
  verificationSuccessUrl: Type.Optional(Type.String({ format: 'uri' })),
  verificationFailureUrl: Type.Optional(Type.String({ format: 'uri' })),
  source: CirclePaymentSourceSchema,
  description: Type.String({ nullable: true }),
  encryptedData: Type.Optional(Type.String({ nullable: true })),
})

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

const CircleBankAccountSchema = Type.Object({
  id: Type.String(),
  status: Type.Enum(CircleBankAccountStatus),
  description: Type.String(),
  trackingRef: Type.Optional(Type.String()),
  fingerprint: Type.Optional(Type.String()),
  billingDetails: CircleBillingDetailsSchema,
  bankAddress: CircleCreateBankAccountSchema,
  createDate: Type.String(),
  updateDate: Type.String(),
})

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

const CircleTransferSchema = Type.Object({
  id: IdSchema,
  source: Type.Object({
    type: Type.String(),
    id: Type.String(),
  }),
  destination: Type.Object({
    type: Type.String(),
    address: Type.String(),
    addressTag: Type.Optional(Type.String()),
    chain: Type.String(),
  }),
  amount: Type.Object({
    amount: Type.String(),
    currency: Type.String(),
  }),
  transactionHash: Type.Optional(Type.String()),
  status: Type.Enum(CircleTransferStatus),
  errorCode: Type.Optional(Type.Enum(CircleTransferErrorCode)),
  createDate: Type.String(),
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

const CirclePaymentQuerySchema = Type.Object({
  source: Type.Optional(Type.String()),
  settlementId: Type.Optional(Type.String()),
  type: Type.Optional(Type.Enum(CirclePaymentQueryType)),
  from: Type.Optional(Type.String({ type: 'date-time' })),
  to: Type.Optional(Type.String({ type: 'date-time' })),
  pageBefore: Type.Optional(Type.String()),
  pageAfter: Type.Optional(Type.String()),
  pageSize: Type.Optional(Type.Number()),
  status: Type.Optional(Type.Enum(PaymentStatus)),
})

const CircleTransferQuerySchema = Type.Object({
  from: Type.Optional(Type.String({ type: 'date-time' })),
  to: Type.Optional(Type.String({ type: 'date-time' })),
  pageBefore: Type.Optional(Type.String()),
  pageAfter: Type.Optional(Type.String()),
  pageSize: Type.Optional(Type.Number()),
})

// #endregion
// #region Coinbase

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

// #endregion
// #region Payment/card routes schemas

export const CountrySchema = Type.Object({
  code: Type.String(),
  name: Nullable(Type.Optional(Type.String())),
})

export const CountriesSchema = Type.Array(CountrySchema)

export const CurrencySchema = Type.Object({
  base: Type.Number(),
  code: Type.String(),
  name: Nullable(Type.Optional(Type.String())),
})

export const CountriesSchema = Type.Array(CountrySchema)

export const GetPaymentBankAccountInstructionsSchema = Type.Object({
  trackingRef: Type.String(),
  beneficiary: Type.Object({
    name: Type.String(),
    address1: Type.String(),
    address2: Type.String(),
  }),
  beneficiaryBank: Type.Object({
    name: Type.Optional(Type.String()),
    swiftCode: Type.Optional(Type.String()),
    routingNumber: Type.String(),
    accountNumber: Type.String(),
    address: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    postalCode: Type.Optional(Type.String()),
    country: Type.Optional(Type.String()),
  }),
  status: Type.Optional(Type.Enum(PaymentBankAccountStatus)),
})

export const PaymentBankAccountInstructionsSchema = Type.Intersect([
  GetPaymentBankAccountInstructionsSchema,
  Type.Object({
    amount: Type.Number(),
  }),
])

export const GetPaymentBankAccountStatusSchema = Type.Object({
  status: Type.Optional(Type.Enum(PaymentBankAccountStatus)),
})

export const GetPaymentCardStatusSchema = Type.Object({
  status: Type.Optional(Type.Enum(PaymentCardStatus)),
})

export const PaymentQuerystringSchema = Type.Object({
  isAdmin: Type.Optional(Type.Boolean()),
  isExternalId: Type.Optional(Type.Boolean()),
})

export const PackForPaymentSchema = Type.Intersect([
  PackSchema,
  Type.Object({
    template: Type.Optional(Nullable(PackBaseSchema)),
  }),
])

export const PaymentSchema = Type.Intersect([
  BaseSchema,
  PaymentBaseSchema,
  Type.Omit(ToPaymentBaseSchema, ['externalId', 'amount', 'error']),
  Type.Object({
    externalId: Nullable(Type.Optional(Type.String({ format: 'uuid' }))),
    amount: Type.Optional(Type.String()),
    sourceId: Type.Optional(Type.String()),
    pack: Type.Optional(PackForPaymentSchema),
    payer: Type.Optional(UserAccountSchema),
  }),
])

export const PaymentIdSchema = Type.Object({
  paymentId: Type.String(),
})

export const PaymentsSchema = Type.Object({
  payments: Type.Array(PaymentSchema),
  total: Type.Number(),
})

export const PaymentsQuerystringSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    locale: Type.Optional(Type.String()),
    packId: Type.Optional(Type.String({ format: 'uuid' })),
    packSlug: Type.Optional(Type.String()),
    payerExternalId: Type.Optional(Type.String()),
    payerUsername: Type.Optional(Type.String()),
    sortBy: Type.Optional(
      Type.Enum(PaymentSortField, { default: PaymentSortField.UpdatedAt })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Ascending })
    ),
  }),
])

export const PaymentCardSchema = Type.Intersect([
  BaseSchema,
  PaymentCardBaseSchema,
])

export const PaymentBankAccountSchema = Type.Intersect([
  BaseSchema,
  PaymentBankAccountBaseSchema,
])

export const PaymentCardsSchema = Type.Array(PaymentCardSchema)

export const PaymentCardNoSaveSchema = Type.Object({
  externalId: Type.String(),
  status: Type.Enum(CircleCardStatus),
})

export const CardIdSchema = Type.Object({
  cardId: Type.String({ format: 'uuid' }),
})

export const BankAccountIdSchema = Type.Object({
  bankAccountId: Type.String({ format: 'uuid' }),
})

export const CreateCardSchema = Type.Intersect([
  Type.Omit(CircleCreateCardSchema, ['expMonth', 'expYear', 'idempotencyKey']),
  Type.Object({
    id: Type.Optional(Type.String({ format: 'uuid' })),
    expirationMonth: Type.Number(),
    expirationYear: Type.Number(),
    saveCard: Type.Optional(Type.Boolean()),
    ownerExternalId: Type.String(),
    default: Type.Optional(Type.Boolean()),
  }),
])

export const CreateBankAccountResponseSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    status: Type.Enum(PaymentBankAccountStatus),
  }),
])

export const CreateBankAccountSchema = Type.Intersect([
  Type.Omit(CircleCreateBankAccountSchema, ['idempotencyKey']),
  Type.Object({
    packTemplateId: IdSchema,
    ownerExternalId: Type.String(),
  }),
])

export const CreatePaymentCardSchema = Type.Union([
  PaymentCardSchema,
  PaymentCardNoSaveSchema,
])

export const CreatePaymentSchema = Type.Intersect([
  Type.Omit(CircleCreatePaymentSchema, ['source', 'amount', 'idempotencyKey']),
  Type.Omit(PaymentBaseSchema, ['payerId']),
  Type.Object({
    cardId: Type.String(),
    packTemplateId: Type.String({ format: 'uuid' }),
    payerExternalId: Type.String(),
  }),
])

export const CreateTransferPaymentSchema = Type.Intersect([
  Type.Omit(PaymentBaseSchema, ['payerId']),
  Type.Object({
    packTemplateId: Type.String({ format: 'uuid' }),
    payerExternalId: Type.String(),
  }),
])

export const PublicKeySchema = Type.Object({
  keyId: Type.String(),
  publicKey: Type.String(),
})

export const UpdatePaymentSchema = Type.Object({
  externalId: Type.Optional(Type.String()),
  status: Type.Enum(PaymentStatus),
})

export const UpdatePaymentCardSchema = Type.Object({
  default: Type.Boolean(),
  ownerExternalId: Type.String(),
})

export const WirePaymentSchema = Type.Intersect([
  BaseSchema,
  ToPaymentBaseSchema,
  Type.Object({
    type: Type.Optional(Type.Enum(CheckoutMethod)),
  }),
])

// #endregion
// #region Types

export type BankAccountId = Simplify<Static<typeof BankAccountIdSchema>>
export type CardId = Simplify<Static<typeof CardIdSchema>>
export type CircleBlockchainAddress = Simplify<
  Static<typeof CircleBlockchainAddressSchema>
>
export type CircleBankAccount = Simplify<Static<typeof CircleBankAccountSchema>>
export type CircleCard = Simplify<Static<typeof CircleCardSchema>>
export type CircleCardVerification = Simplify<
  Static<typeof CircleCardVerificationSchema>
>
export type CircleCreateBlockchainAddress = Simplify<
  Static<typeof CircleCreateBlockchainAddressSchema>
>
export type CircleCreateBankAccount = Simplify<
  Static<typeof CircleCreateBankAccountSchema>
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
export type CirclePaymentQuery = Simplify<
  Static<typeof CirclePaymentQuerySchema>
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
export type CoinbaseExchangeRatesOptions = Simplify<
  Static<typeof CoinbaseExchangeRatesOptionsSchema>
>
export type CoinbaseExchangeRates = Simplify<
  Static<typeof CoinbaseExchangeRatesSchema>
>
export type CoinbaseErrorResponse = Simplify<
  Static<typeof CoinbaseErrorResponseSchema>
>
export type CreateBankAccount = Simplify<Static<typeof CreateBankAccountSchema>>
export type CreateBankAccountResponse = Simplify<
  Static<typeof CreateBankAccountResponseSchema>
>
export type CreateCard = Simplify<Static<typeof CreateCardSchema>>
export type CreatePayment = Simplify<Static<typeof CreatePaymentSchema>>
export type CreatePaymentCard = Simplify<Static<typeof CreatePaymentCardSchema>>
export type CreateTransferPayment = Simplify<
  Static<typeof CreateTransferPaymentSchema>
>
export type Country = Simplify<Static<typeof CountrySchema>>
export type Countries = Simplify<Static<typeof CountriesSchema>>
export type Currency = Simplify<Static<typeof CurrencySchema>>
export type FindTransferByAddress = Simplify<
  Static<typeof FindTransferByAddressSchema>
>
export type GetPaymentBankAccountInstructions = Simplify<
  Static<typeof GetPaymentBankAccountInstructionsSchema>
>
export type GetPaymentBankAccountStatus = Simplify<
  Static<typeof GetPaymentBankAccountStatusSchema>
>
export type GetPaymentCardStatus = Simplify<
  Static<typeof GetPaymentCardStatusSchema>
>
export type Payment = Simplify<Static<typeof PaymentSchema>>
export type PaymentId = Simplify<Static<typeof PaymentIdSchema>>
export type PaymentBankAccount = Simplify<
  Static<typeof PaymentBankAccountSchema>
>
export type PaymentBankAccountInstructions = Simplify<
  Static<typeof PaymentBankAccountInstructionsSchema>
>
export type PaymentCard = Simplify<Static<typeof PaymentCardSchema>>
export type PaymentCards = Simplify<Static<typeof PaymentCardsSchema>>
export type PaymentQuerystring = Simplify<
  Static<typeof PaymentQuerystringSchema>
>
export type Payments = Simplify<Static<typeof PaymentsSchema>>
export type PaymentsQuerystring = Simplify<
  Static<typeof PaymentsQuerystringSchema>
>
export type PublicKey = Simplify<Static<typeof PublicKeySchema>>
export type SendBankAccountInstructions = Simplify<
  Static<typeof SendBankAccountInstructionsSchema>
>
export type ToPaymentBankAccountBase = Simplify<
  Static<typeof ToPaymentBankAccountBaseSchema>
>
export type ToPaymentBase = Simplify<Static<typeof ToPaymentBaseSchema>>
export type ToPaymentCardBase = Simplify<Static<typeof ToPaymentCardBaseSchema>>
export type UpdatePayment = Simplify<Static<typeof UpdatePaymentSchema>>
export type UpdatePaymentCard = Simplify<Static<typeof UpdatePaymentCardSchema>>
export type WirePayment = Simplify<Static<typeof WirePaymentSchema>>

// #endregion
// #region Success/error response
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

// #endregion
