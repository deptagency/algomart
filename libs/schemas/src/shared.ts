import { Static, TSchema, Type } from '@sinclair/typebox'

export const DEFAULT_CURRENCY = 'USD'
export const DEFAULT_LOCALE = 'en-UK'
export const DEFAULT_LANG = 'en-UK'

export const LANG_COOKIE = 'language'
export const SUPPORTED_LANGUAGES = ['en-UK', 'es-ES', 'fr-FR']
export const RTL_LANGUAGES: string[] = [
  'ar',
  'arc',
  'dv',
  'fa',
  'ha',
  'he',
  'khw',
  'ks',
  'ku',
  'ps',
  'ur',
  'yi',
]

export const CURRENCY_COOKIE = 'currency'

export const regExpToString = (pattern: RegExp) => String(pattern).slice(1, -1)

export const Base64Pattern = /^[\d+/=A-Za-z]+$/
export const Base64Schema = Type.String({
  pattern: regExpToString(Base64Pattern),
})

export const HexColorPattern = /^#?([\dA-Fa-f]{6}|[\dA-Fa-f]{3})$/
export const HexColorSchema = Type.String({
  pattern: regExpToString(HexColorPattern),
})

// Matches 58 uppercase letters and numbers 2-7 (Base32)
export const AlgorandAccountAddressPattern = /^[2-7A-Z]{58}$/
export const AlgorandAccountAddressSchema = Type.String({
  maxLength: 58,
  minLength: 58,
  pattern: regExpToString(AlgorandAccountAddressPattern),
})
export const AlgorandAccountAddressObjectSchema = Type.Object({
  address: AlgorandAccountAddressSchema,
})

export const AlgorandAssetIndexSchema = Type.Integer({ minimum: 1 })

export const AlgorandTransactionIdPattern = /^[2-7A-Z]{52}$/
export const AlgorandTransactionIdSchema = Type.String({
  maxLength: 52,
  minLength: 52,
  pattern: regExpToString(AlgorandTransactionIdPattern),
})

export const IdSchema = Type.String({ format: 'uuid' })

export const IdParameterSchema = Type.Object({
  id: IdSchema,
})

export const FirebaseIdPattern = /^[\dA-Za-z]{28}$/
export const FirebaseIdSchema = Type.String({
  pattern: regExpToString(FirebaseIdPattern),
  minLength: 28,
  maxLength: 28,
})

export const UserExternalIdSchema = Type.Union([IdSchema, FirebaseIdSchema])
export const UserExternalIdObjectSchema = Type.Object({
  userExternalId: UserExternalIdSchema,
})
export const OptionalUserExternalIdObjectSchema = Type.Object({
  userExternalId: Type.Optional(UserExternalIdSchema),
})

export const CircleWalletIdPattern = /^\d+$/
export const CircleWalletIdSchema = Type.String({
  pattern: regExpToString(CircleWalletIdPattern),
})

export enum CircleTransferStatus {
  Running = 'running',
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum CirclePayoutStatus {
  Pending = 'pending',
  Failed = 'failed',
  Complete = 'complete',
}

export enum CirclePayoutDestinationType {
  WIRE = 'wire',
  ACH = 'ach',
  SEPA = 'sepa',
}

export const BaseSchema = Type.Object({
  createdAt: Type.Optional(Type.String({ format: 'date-time' })),
  id: Type.Optional(IdSchema),
  updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
})

export const PageSchema = Type.Number({ minimum: 1, default: 1 })
export const PageSizeSchema = Type.Number({
  minimum: -1,
  maximum: 100,
  default: 10,
})

export const PaginationSchema = Type.Object({
  page: Type.Optional(PageSchema),
  pageSize: Type.Optional(PageSizeSchema),
})

// Matches `en` and `en-US`
export const LanguagePattern = /^[a-z]{2}(-[A-Z]{2})?$/
export const LanguageSchema = Type.String({
  pattern: regExpToString(LanguagePattern),
  minLength: 2,
  maxLength: 5,
})
export const LanguageObjectSchema = Type.Object({
  language: Type.Optional(LanguageSchema),
})

// Match US and USA style country codes
export const CountryCodePattern = /^[A-Z]{2,3}$/
export const CountryCodeSchema = Type.String({
  pattern: regExpToString(CountryCodePattern),
  minLength: 2,
  maxLength: 3,
})

export const LanguageAndUserExternalIdSchema = Type.Intersect([
  LanguageObjectSchema,
  UserExternalIdObjectSchema,
])

// Base32 https://www.crockford.com/base32.html
// This gives us 12^32 possibilities
export const REDEMPTION_CODE_CHARACTERS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const REDEMPTION_CODE_LENGTH = 12
export const RedeemCodePattern = new RegExp(
  `^[${REDEMPTION_CODE_CHARACTERS}]{12}$`
)
export const RedeemCodeSchema = Type.String({
  pattern: regExpToString(RedeemCodePattern),
  minLength: REDEMPTION_CODE_LENGTH,
  maxLength: REDEMPTION_CODE_LENGTH,
})
export const RedeemCodeObjectSchema = Type.Object({
  redeemCode: RedeemCodeSchema,
})

// Price schemas
export const MinCircleCreditPaymentAmountInCents = 50
export const MaxCurrencyAmountInCents = 100_000_000_000 // $1,000,000,000.00 should be plenty...
export const CurrencyAmountSchema = Type.Integer({
  minimum: -MaxCurrencyAmountInCents,
  maximum: MaxCurrencyAmountInCents,
})
export const CurrencyAmountStringPattern = /^-?\d+$/
export const CurrencyAmountStringSchema = Type.String({
  pattern: regExpToString(CurrencyAmountStringPattern),
})
// Floating point, e.g. 2.59, n.b. this can never be negative
export const CirclePricePattern = /^\d+\.\d{2}$/
export const CirclePriceSchema = Type.String({
  pattern: regExpToString(CirclePricePattern),
})

// Matches 3-8 uppercase letters
export const CurrencyCodePattern = /^[A-Z]{3,8}$/
export const CurrencyCodeSchema = Type.String({
  pattern: regExpToString(CurrencyCodePattern),
  minLength: 3,
  maxLength: 3,
})

export enum SortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

export enum SortOptions {
  Name = 'Name',
  Newest = 'Newest',
  Oldest = 'Oldest',
  RarityAscending = 'RarityAscending',
  RarityDescending = 'RarityDescending',
}

export const RarityBaseSchema = Type.Object({
  code: Type.String(),
  color: Type.String(),
  description: Type.String(),
  image: Type.String({ format: 'uri' }),
  name: Type.String(),
})

export const SlugPattern = /^[\da-z-]+$/
export const SlugSchema = Type.String({ pattern: regExpToString(SlugPattern) })
export const SlugObjectSchema = Type.Object({
  slug: SlugSchema,
})

export const PageAndLanguageSchema = Type.Intersect([
  LanguageObjectSchema,
  SlugObjectSchema,
])

export const UniqueCodePattern = /^[\dA-Za-z]{1,8}$/
export const UniqueCodeSchema = Type.String({
  pattern: regExpToString(UniqueCodePattern),
  minLength: 1,
  maxLength: 8,
})

// Sanity check for postal codes
// Should cover most cases and disallow odd characters
// Allows 01234, 01234-5678, 12345 SE, etc
export const PostalCodePattern = /^[\dA-Za-z][\d A-Za-z-]{0,10}[\dA-Za-z]$/
export const PostalCodeSchema = Type.String({
  pattern: regExpToString(PostalCodePattern),
  minLength: 2,
  maxLength: 10,
})

export enum EntityType {
  AlgorandAccount = 'AlgorandAccount',
  AlgorandTransaction = 'AlgorandTransaction',
  AlgorandTransactionGroup = 'AlgorandTransactionGroup',
  Bid = 'Bid',
  CmsCacheApplication = 'CmsCacheApplication',
  CmsCacheCollectibleTemplates = 'CmsCacheCollectibleTemplates',
  CmsCacheCollections = 'CmsCacheCollections',
  CmsCacheFaqs = 'CmsCacheFaqs',
  CmsCacheHomepage = 'CmsCacheHomepage',
  CmsCacheLanguages = 'CmsCacheLanguages',
  CmsCachePackTemplates = 'CmsCachePackTemplates',
  CmsCachePages = 'CmsCachePages',
  CmsCacheSets = 'CmsCacheSets',
  CmsCacheTags = 'CmsCacheTags',
  Collectible = 'Collectible',
  CollectibleAuction = 'CollectibleAuction',
  CollectibleAuctionBid = 'CollectibleAuctionBid',
  CollectibleListings = 'CollectibleListings',
  CollectibleOwnership = 'CollectibleOwnership',
  CollectibleShowcase = 'CollectibleShowcase',
  Notification = 'Notification',
  Pack = 'Pack',
  Payment = 'Payment',
  PaymentCard = 'PaymentCard',
  Payout = 'Payout',
  UserAccount = 'UserAccount',
  UserAccountTransfer = 'UserAccountTransfer',
  WireBankAccount = 'WireBankAccount',
  WirePayout = 'WirePayout',
  WirePayoutFailedRefund = 'WirePayoutFailedRefund',
  WirePayoutReturn = 'WirePayoutReturn',
}

export const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()])

// From https://github.com/sindresorhus/type-fest/blob/main/source/simplify.d.ts
export type Simplify<T> = T extends unknown[]
  ? Array<Simplify<T[number]>>
  : { [KeyType in keyof T]: Simplify<T[KeyType]> }

export type AlgoAddress = Simplify<
  Static<typeof AlgorandAccountAddressObjectSchema>
>
export type Base = Simplify<Static<typeof BaseSchema>>
export type UserExternalId = Simplify<Static<typeof UserExternalIdSchema>>
export type UserExternalIdObject = Simplify<
  Static<typeof UserExternalIdObjectSchema>
>
export type OptionalUserExternalIdObject = Simplify<
  Static<typeof OptionalUserExternalIdObjectSchema>
>
export type Pagination = Simplify<Static<typeof PaginationSchema>>
export type Slug = Simplify<Static<typeof SlugObjectSchema>>
export type Language = Simplify<Static<typeof LanguageObjectSchema>>
export type LanguageAndUserExternalId = Simplify<
  Static<typeof LanguageAndUserExternalIdSchema>
>
export type IdParameter = Simplify<Static<typeof IdParameterSchema>>
export type RarityBase = Simplify<Static<typeof RarityBaseSchema>>
