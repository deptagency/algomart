import { Static, Type } from '@sinclair/typebox'

import { UserAccountSchema } from './accounts'
import {
  CircleCardErrorCode,
  CircleCreateCardSchema,
  CircleCreatePaymentSchema,
  CirclePaymentCardNetwork,
  CirclePaymentErrorCode,
  CircleTransferErrorCode,
} from './circle'
import { PackBaseSchema, PackSchema } from './packs'
import {
  AlgorandAccountAddressSchema,
  BaseSchema,
  CountryCodeSchema,
  CurrencyAmountStringSchema,
  IdSchema,
  LanguageSchema,
  Nullable,
  PaginationSchema,
  Simplify,
  SortDirection,
  UserExternalIdSchema,
} from './shared'

// #region Enums

export enum PaymentStatus {
  ActionRequired = 'action_required',
  Canceled = 'canceled',
  Confirmed = 'confirmed',
  Failed = 'failed',
  Paid = 'paid',
  Pending = 'pending',
}

export enum PaymentCardStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
  Inactive = 'inactive',
}

export enum PaymentItem {
  Collectible = 'collectible',
  Credits = 'credits',
  Pack = 'pack',
}

export enum CheckoutStatus {
  form = 'form',
  submitting = 'submitting',
  awaitingCreditTransfer = 'awaiting credit transfer',
  success = 'success',
  error = 'error',
  kyc = 'kyc',
  summary = 'summary',
}

export enum PaymentSortField {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Status = 'status',
}

// #endregion

// #region Schemas

const ToPaymentCardBaseSchema = Type.Object({
  countryCode: CountryCodeSchema,
  expirationMonth: Type.Optional(
    Nullable(
      Type.String({
        pattern: '^[0-9]{2}$',
        minLength: 2,
        maxLength: 2,
      })
    )
  ),
  expirationYear: Type.Optional(
    Nullable(
      Type.String({
        pattern: '^[0-9]{4}$',
        minLength: 4,
        maxLength: 4,
      })
    )
  ),
  externalId: Type.Optional(Nullable(IdSchema)),
  userExternalId: Type.Optional(UserExternalIdSchema),
  network: Type.Optional(Nullable(Type.Enum(CirclePaymentCardNetwork))),
  lastFour: Type.Optional(
    Nullable(
      Type.String({
        pattern: '^[0-9]{4}$',
        minLength: 4,
        maxLength: 4,
      })
    )
  ),
  status: Type.Optional(Type.Enum(PaymentCardStatus)),
  error: Type.Optional(Nullable(Type.Enum(CircleCardErrorCode))),
  // This needs to be kept generic to store validation errors
  // Should never be set by or displayed to a user
  errorDetails: Type.Optional(Type.String()),
})

export const ToPaymentBaseSchema = Type.Object({
  externalId: IdSchema,
  status: Type.Optional(Type.Enum(PaymentStatus)),
  error: Type.Optional(
    Type.Union([
      Type.Enum(CirclePaymentErrorCode),
      Type.Enum(CircleTransferErrorCode),
    ])
  ),
  amount: CurrencyAmountStringSchema,
  action: Type.Optional(Type.String({ format: 'uri' })),
  sourceId: Type.Optional(Type.String()),
})

const PaymentBaseSchema = Type.Object({
  payerId: IdSchema,
  paymentCardId: Type.Optional(Nullable(IdSchema)),
  destinationAddress: Type.Optional(Nullable(AlgorandAccountAddressSchema)),
  transferId: Type.Optional(Nullable(IdSchema)),
  itemId: Type.Optional(IdSchema),
  itemType: Type.Optional(Type.Enum(PaymentItem)),
})

const PaymentCardBaseSchema = Type.Intersect([
  ToPaymentCardBaseSchema,
  Type.Object({
    ownerId: IdSchema,
    payload: Type.Optional(Nullable(CircleCreateCardSchema)),
    idempotencyKey: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    default: Type.Boolean(),
    isSaved: Type.Boolean(),
  }),
])

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

// #endregion Coinbase

// #region Chainalysis

const ChainalysisSanctionedAddressSchema = Type.Object({
  category: Type.Optional(Nullable(Type.String())),
  name: Type.Optional(Nullable(Type.String())),
  description: Type.Optional(Nullable(Type.String())),
  url: Type.Optional(Nullable(Type.String({ format: 'uri' }))),
})

const ChainalysisErrorResponseSchema = Type.Object({
  type: Nullable(Type.String()),
})

// #endregion Chainalysis

// #region Payment/card routes schemas

export const CountrySchema = Type.Object({
  code: CountryCodeSchema,
  flagEmoji: Type.String(),
  name: Nullable(Type.Optional(Type.String())),
})

export const CountriesSchema = Type.Array(CountrySchema)

export const GetPaymentCardStatusSchema = Type.Object({
  status: Type.Optional(Type.Enum(PaymentCardStatus)),
})

export const PaymentQuerystringSchema = Type.Object({
  userExternalId: Type.Optional(UserExternalIdSchema),
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
    externalId: Type.Optional(Nullable(IdSchema)),
    sourceId: Type.Optional(Type.String()),
    payer: Type.Optional(Nullable(UserAccountSchema)),
    amount: CurrencyAmountStringSchema,
    fees: CurrencyAmountStringSchema,
    total: CurrencyAmountStringSchema,
    error: Type.Optional(
      Nullable(
        Type.Union([
          Type.Enum(CirclePaymentErrorCode),
          Type.Enum(CircleTransferErrorCode),
        ])
      )
    ),
    // This needs to be kept generic to store validation errors
    // Should never be set by or displayed to a user
    errorDetails: Type.Optional(Nullable(Type.String())),
  }),
])

export const PaymentIdSchema = Type.Object({
  paymentId: IdSchema,
})

export const PaymentsSchema = Type.Object({
  payments: Type.Array(PaymentSchema),
  total: Type.Integer({ minimum: 0 }),
})

export const PaymentsQuerystringSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    includeAmount: Type.Optional(Type.Boolean()),
    language: Type.Optional(LanguageSchema),
    status: Type.Optional(Type.Array(Type.Enum(PaymentStatus))),
    sortBy: Type.Optional(
      Type.Enum(PaymentSortField, { default: PaymentSortField.UpdatedAt })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Ascending })
    ),
  }),
])

export const GetPaymentsMissingTransfersResponseSchema = Type.Object({
  payments: Type.Array(
    Type.Object({
      id: Type.String(),
      amount: CurrencyAmountStringSchema,
      createdAt: Type.String({ format: 'date-time' }),
    })
  ),
  total: Type.Integer({ minimum: 0 }),
})

export const GetPaymentsMissingTransfersQuerystringSchema = Type.Object({
  userId: IdSchema,
})

export const PaymentCardSchema = Type.Intersect([
  BaseSchema,
  PaymentCardBaseSchema,
])

export const PaymentCardsSchema = Type.Array(PaymentCardSchema)

export const CardIdSchema = Type.Object({
  cardId: IdSchema,
})

export const CreateCardSchema = Type.Intersect([
  Type.Omit(CircleCreateCardSchema, [
    'expMonth',
    'expYear',
    'idempotencyKey',
    'metadata',
  ]),
  Type.Object({
    id: Type.Optional(IdSchema),
    expirationMonth: Type.Number(),
    expirationYear: Type.Number(),
    saveCard: Type.Optional(Type.Boolean()),
    default: Type.Optional(Type.Boolean()),
  }),
])

export const CreatePaymentCardSchema = PaymentCardSchema

export const CreateCcPaymentSchema = Type.Intersect([
  Type.Omit(CircleCreatePaymentSchema, ['source', 'amount', 'idempotencyKey']),
  Type.Omit(PaymentBaseSchema, ['payerId']),
  Type.Object({
    amount: CurrencyAmountStringSchema,
    cardId: IdSchema,
  }),
])

export const CreateUsdcPaymentSchema = Type.Object({
  encodedSignedTransaction: Type.String(),
  itemId: Type.Optional(IdSchema),
  itemType: Type.Optional(Type.Enum(PaymentItem)),
})

export const PurchasePackWithCreditsSchema = Type.Object({
  packTemplateId: Type.Optional(IdSchema),
  packId: Type.Optional(IdSchema),
})

export const PackUnifiedPaymentSchema = Type.Intersect([
  PurchasePackWithCreditsSchema,
  CreateCcPaymentSchema,
])

export const PublicKeySchema = Type.Object({
  keyId: Type.String(),
  publicKey: Type.String(),
})

export const UpdatePaymentCardSchema = Type.Object({
  default: Type.Boolean(),
})

// #endregion Payment/card routes schemas
// #region Types

export type CardId = Simplify<Static<typeof CardIdSchema>>
export type ChainalysisErrorResponse = Simplify<
  Static<typeof ChainalysisErrorResponseSchema>
>
export type ChainalysisSanctionedAddress = Simplify<
  Static<typeof ChainalysisSanctionedAddressSchema>
>
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
export type CreateCcPayment = Simplify<Static<typeof CreateCcPaymentSchema>>
export type CreateUsdcPayment = Simplify<Static<typeof CreateUsdcPaymentSchema>>
export type Country = Simplify<Static<typeof CountrySchema>>
export type Countries = Simplify<Static<typeof CountriesSchema>>

export type GetPaymentCardStatus = Simplify<
  Static<typeof GetPaymentCardStatusSchema>
>
export type Payment = Simplify<Static<typeof PaymentSchema>>
export type PaymentId = Simplify<Static<typeof PaymentIdSchema>>
export type PaymentCard = Simplify<Static<typeof PaymentCardSchema>>
export type PaymentCards = Simplify<Static<typeof PaymentCardsSchema>>
export type PaymentQuerystring = Simplify<
  Static<typeof PaymentQuerystringSchema>
>
export type Payments = Simplify<Static<typeof PaymentsSchema>>
export type PaymentsQuerystring = Simplify<
  Static<typeof PaymentsQuerystringSchema>
>
export type GetPaymentsMissingTransfersResponse = Simplify<
  Static<typeof GetPaymentsMissingTransfersResponseSchema>
>
export type GetPaymentsMissingTransfersQuerystring = Simplify<
  Static<typeof GetPaymentsMissingTransfersQuerystringSchema>
>
export type PublicKey = Simplify<Static<typeof PublicKeySchema>>
export type PurchasePackWithCredits = Simplify<
  Static<typeof PurchasePackWithCreditsSchema>
>
export type ToPaymentBase = Simplify<Static<typeof ToPaymentBaseSchema>>
export type ToPaymentCardBase = Simplify<Static<typeof ToPaymentCardBaseSchema>>
export type UpdatePaymentCard = Simplify<Static<typeof UpdatePaymentCardSchema>>

// #endregion

// #region Success/error response

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

export type ChainalysisResponse<T = unknown> = T | ChainalysisErrorResponse

export function isChainalysisSuccessResponse<T = unknown>(
  response: ChainalysisResponse<T>
): response is T {
  const data = response as T
  return !!data
}

// #endregion
