import { Static, Type } from '@sinclair/typebox'

import { BidPublicSchema } from './bids'
import { CollectibleListSchema } from './collectibles'
import {
  BaseSchema,
  ExternalIdSchema,
  IdSchema,
  Nullable,
  PaginationSchema,
  Simplify,
  SortDirection,
} from './shared'

export enum PackType {
  Auction = 'auction',
  Free = 'free',
  Purchase = 'purchase',
  Redeem = 'redeem',
}

export enum PackStatus {
  Upcoming = 'Upcoming',
  Active = 'Active',
  Expired = 'Expired',
}

export enum PackCollectibleOrder {
  Match = 'match',
  Random = 'random',
}

export enum PackCollectibleDistribution {
  OneOfEach = 'one-of-each',
  Random = 'random',
}

export enum PackSortField {
  ReleasedAt = 'releasedAt',
  Title = 'title',
}

export enum PackSortByOwnerField {
  ClaimedAt = 'claimedAt',
}

// Base32 https://www.crockford.com/base32.html
// This gives us 12^32 possibilities
export const REDEMPTION_CODE_CHARACTERS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const REDEMPTION_CODE_LENGTH = 12

export const PackTemplateIdSchema = Type.Object({
  templateId: IdSchema,
})

export const ClaimFreePackSchema = Type.Intersect([
  ExternalIdSchema,
  Type.Object({
    templateId: IdSchema,
  }),
])

export const ClaimRedeemPackSchema = Type.Intersect([
  ExternalIdSchema,
  Type.Object({
    redeemCode: Type.String(),
  }),
])

export const ClaimPackSchema = Type.Object({
  packId: IdSchema,
  claimedById: Type.Optional(Nullable(IdSchema)),
  claimedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
})

export const PackConfigSchema = Type.Object({
  collectibleDistribution: Type.Enum(PackCollectibleDistribution),
  collectibleOrder: Type.Enum(PackCollectibleOrder),
  collectiblesPerPack: Type.Integer(),
})

export const PackBaseSchema = Type.Object({
  allowBidExpiration: Type.Boolean(),
  auctionUntil: Type.Optional(Type.String({ format: 'date-time' })),
  body: Type.Optional(Type.String()),
  collectibleTemplateIds: Type.Array(IdSchema),
  config: PackConfigSchema,
  image: Type.String({ format: 'uri' }),
  onePackPerCustomer: Type.Boolean(),
  price: Type.Number(),
  releasedAt: Type.Optional(Type.String({ format: 'date-time' })),
  slug: Type.String(),
  status: Type.Enum(PackStatus),
  subtitle: Type.Optional(Type.String()),
  templateId: IdSchema,
  title: Type.String(),
  type: Type.Enum(PackType),
})

export const PublishedPackSchema = Type.Intersect([
  PackBaseSchema,
  Type.Object({
    available: Type.Number(),
    total: Type.Number(),
    activeBid: Type.Optional(Type.Number()),
  }),
])

export const PublishedPacksSchema = Type.Object({
  packs: Type.Array(PublishedPackSchema),
  total: Type.Number(),
})

export const PackByOwnerSchema = Type.Intersect([
  PackBaseSchema,
  Type.Object({
    activeBid: Type.Optional(Type.Number()),
    claimedAt: Type.String({ format: 'date-time' }),
  }),
])

export const PacksByOwnerSchema = Type.Object({
  packs: Type.Array(PackByOwnerSchema),
  total: Type.Number(),
})

export const PublishedPacksQuerySchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    locale: Type.Optional(Type.String()),
    slug: Type.Optional(Type.String()),
    templateIds: Type.Optional(Type.Array(IdSchema)),
    priceLow: Type.Optional(Type.Number()),
    priceHigh: Type.Optional(Type.Number()),
    type: Type.Optional(Type.Array(Type.Enum(PackType))),
    status: Type.Optional(Type.Array(Type.Enum(PackStatus))),
    reserveMet: Type.Optional(Type.Boolean()),
    sortBy: Type.Optional(
      Type.Enum(PackSortField, { default: PackSortField.Title })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Ascending })
    ),
  }),
])

export const PacksByOwnerQuerySchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    locale: Type.Optional(Type.String()),
    slug: Type.Optional(Type.String()),
    templateIds: Type.Optional(Type.Array(IdSchema)),
    type: Type.Optional(Type.Array(Type.Enum(PackType))),
    sortBy: Type.Optional(
      Type.Enum(PackSortByOwnerField, {
        default: PackSortByOwnerField.ClaimedAt,
      })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Ascending })
    ),
  }),
])

export const PackWithIdSchema = Type.Intersect([
  PackBaseSchema,
  Type.Object({
    id: IdSchema,
    activeBidId: Type.Optional(IdSchema),
  }),
])

export const PackIdSchema = Type.Object({
  packId: IdSchema,
})

export const PackAuctionSchema = Type.Intersect([
  PackIdSchema,
  Type.Object({
    activeBid: Type.Optional(BidPublicSchema),
    bids: Type.Array(BidPublicSchema),
    ownerExternalId: Type.Optional(IdSchema),
  }),
])

export const PackSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    activeBidId: Type.Optional(Nullable(IdSchema)),
    claimedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    expiresAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    ownerId: Type.Optional(Nullable(IdSchema)),
    redeemCode: Type.Optional(Nullable(Type.String())),
    templateId: IdSchema,
  }),
])

export const PackByTemplateIdSchema = Type.Object({
  templateId: IdSchema,
})

export const RedeemCodeSchema = Type.Object({
  redeemCode: Type.String({
    minLength: REDEMPTION_CODE_LENGTH,
    maxLength: REDEMPTION_CODE_LENGTH,
    pattern: `^[A-Z0-9]{${REDEMPTION_CODE_LENGTH}}$`,
  }),
})

export const TransferPackSchema = Type.Object({
  externalId: Type.String(),
  packId: IdSchema,
  passphrase: Type.String(),
})

export const PackWithCollectiblesSchema = Type.Intersect([
  PackWithIdSchema,
  Type.Object({
    collectibles: CollectibleListSchema,
  }),
])

export type ClaimFreePack = Simplify<Static<typeof ClaimFreePackSchema>>
export type ClaimPack = Simplify<Static<typeof ClaimPackSchema>>
export type ClaimRedeemPack = Simplify<Static<typeof ClaimRedeemPackSchema>>
export type Pack = Simplify<Static<typeof PackSchema>>
export type PackAuction = Simplify<Static<typeof PackAuctionSchema>>
export type PackBase = Simplify<Static<typeof PackBaseSchema>>
export type PackByTemplateId = Simplify<Static<typeof PackByTemplateIdSchema>>
export type PackId = Simplify<Static<typeof PackIdSchema>>
export type PackTemplateId = Simplify<Static<typeof PackTemplateIdSchema>>
export type PackWithCollectibles = Simplify<
  Static<typeof PackWithCollectiblesSchema>
>
export type PackWithId = Simplify<Static<typeof PackWithIdSchema>>
export type PackByOwner = Simplify<Static<typeof PackByOwnerSchema>>
export type PacksByOwner = Simplify<Static<typeof PacksByOwnerSchema>>
export type PacksByOwnerQuery = Simplify<Static<typeof PacksByOwnerQuerySchema>>
export type PublishedPacksQuery = Simplify<
  Static<typeof PublishedPacksQuerySchema>
>
export type PublishedPack = Simplify<Static<typeof PublishedPackSchema>>
export type PublishedPacks = Simplify<Static<typeof PublishedPacksSchema>>
export type RedeemCode = Simplify<Static<typeof RedeemCodeSchema>>
export type TransferPack = Simplify<Static<typeof TransferPackSchema>>
