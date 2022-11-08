import { Static, Type } from '@sinclair/typebox'

import { BidPublicSchema } from './bids'
import {
  CollectibleBaseSchema,
  CollectibleWithDetailsSchema,
} from './collectibles'
import {
  AlgorandAccountAddressSchema,
  BaseSchema,
  CurrencyAmountSchema,
  IdSchema,
  LanguageObjectSchema,
  LanguageSchema,
  Nullable,
  PageSchema,
  PageSizeSchema,
  PaginationSchema,
  RedeemCodeSchema,
  Simplify,
  SlugSchema,
  SortDirection,
  UserExternalIdSchema,
} from './shared'
import { TagSchema } from './tags'
import { AlgorandTransactionStatus } from './transactions'

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
  Title = 'name',
}

export enum PackSortByOwnerField {
  ClaimedAt = 'claimedAt',
}

export enum MintPackStatus {
  Minted = 'minted',
  Pending = 'pending',
}

export const PackTemplateIdSchema = Type.Object({
  templateId: IdSchema,
})

export const ClaimFreePackSchema = Type.Object({
  templateId: IdSchema,
})

export const ClaimRedeemPackSchema = Type.Object({
  redeemCode: RedeemCodeSchema,
})

export const ClaimPackSchema = Type.Object({
  packId: IdSchema,
  claimedById: Type.Optional(Nullable(IdSchema)),
  claimedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
})

export const RevokePackSchema = Type.Object({
  packId: IdSchema,
  ownerId: Type.Optional(Nullable(IdSchema)),
  fromAddress: Type.Optional(Nullable(AlgorandAccountAddressSchema)),
})

export const PackConfigSchema = Type.Object({
  collectibleDistribution: Type.Enum(PackCollectibleDistribution),
  collectibleOrder: Type.Enum(PackCollectibleOrder),
  collectiblesPerPack: Type.Integer({ minimum: 1, maximum: 16 }),
})

export const PackBaseSchema = Type.Object({
  activeBid: Type.Optional(CurrencyAmountSchema),
  additionalImages: Type.Array(Type.String({ format: 'uri' })),
  allowBidExpiration: Type.Boolean(),
  auctionUntil: Type.Optional(Type.String({ format: 'date-time' })),
  banner: Type.Optional(Type.String({ format: 'uri' })),
  body: Type.Optional(Type.String()),
  collectibleTemplates: Type.Optional(
    Nullable(Type.Array(CollectibleBaseSchema))
  ),
  collectibleTemplateIds: Type.Optional(Nullable(Type.Array(IdSchema))),
  config: PackConfigSchema,
  image: Type.String({ format: 'uri' }),
  // TODO: is nftCategory still in use?
  nftCategory: Type.Optional(Type.String({ pattern: '^[a-zA-Z0-9-_]+$' })),
  nftsPerPack: Type.Integer({ minimum: 1, maximum: 16 }),
  onePackPerCustomer: Type.Boolean(),
  price: CurrencyAmountSchema,
  releasedAt: Type.Optional(Type.String({ format: 'date-time' })),
  showNfts: Type.Optional(Type.Boolean()),
  slug: SlugSchema,
  status: Type.Enum(PackStatus),
  subtitle: Type.Optional(Type.String()),
  templateId: IdSchema,
  title: Type.String(),
  type: Type.Enum(PackType),
  tags: Type.Optional(Type.Array(TagSchema)),
})

export const PublishedPackSchema = Type.Intersect([
  PackBaseSchema,
  Type.Object({
    available: Type.Integer({ minimum: 0 }),
    total: Type.Integer({ minimum: 0 }),
    activeBid: Type.Optional(CurrencyAmountSchema),
  }),
])

export const PublishedPacksSchema = Type.Object({
  packs: Type.Array(PublishedPackSchema),
  total: Type.Integer({ minimum: 0 }),
})

export const PackByOwnerSchema = Type.Intersect([
  PackBaseSchema,
  Type.Object({
    id: IdSchema,
    activeBid: Type.Optional(CurrencyAmountSchema),
    claimedAt: Type.String({ format: 'date-time' }),
  }),
])

export const PacksByOwnerSchema = Type.Object({
  packs: Type.Array(PackByOwnerSchema),
  total: Type.Integer({ minimum: 0 }),
})

export const PublishedPacksQuerySchema = Type.Object({
  page: Type.Optional(PageSchema),
  pageSize: Type.Optional(PageSizeSchema),
  language: Type.Optional(LanguageSchema),
  slug: Type.Optional(SlugSchema),
  templateIds: Type.Optional(Type.Array(IdSchema)),
  priceLow: Type.Optional(CurrencyAmountSchema),
  priceHigh: Type.Optional(CurrencyAmountSchema),
  type: Type.Optional(Type.Array(Type.Enum(PackType))),
  status: Type.Optional(Type.Array(Type.Enum(PackStatus))),
  reserveMet: Type.Optional(Type.Boolean()),
  tags: Type.Optional(Type.Array(Type.String())),
  sortBy: Type.Optional(
    Type.Enum(PackSortField, { default: PackSortField.ReleasedAt })
  ),
  sortDirection: Type.Optional(
    Type.Enum(SortDirection, { default: SortDirection.Ascending })
  ),
})

export const PacksByOwnerQuerySchema = Type.Intersect([
  PaginationSchema,
  LanguageObjectSchema,
  Type.Object({
    slug: Type.Optional(SlugSchema),
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
    ownerId: Type.Optional(IdSchema),
  }),
])

export const PackIdSchema = Type.Object({
  packId: IdSchema,
})

export const PackSlugSchema = Type.Object({
  packSlug: SlugSchema,
})

export const PackAuctionSchema = Type.Intersect([
  PackIdSchema,
  Type.Object({
    activeBid: Type.Optional(BidPublicSchema),
    bids: Type.Array(BidPublicSchema),
    userExternalId: Type.Optional(UserExternalIdSchema),
  }),
])

export const PackSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    activeBidId: Type.Optional(Nullable(IdSchema)),
    claimedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    expiresAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    ownerId: Type.Optional(Nullable(IdSchema)),
    redeemCode: Type.Optional(Nullable(RedeemCodeSchema)),
    templateId: IdSchema,
  }),
])

export const PackByTemplateIdSchema = Type.Object({
  templateId: IdSchema,
})

export const RedeemObjectCodeSchema = Type.Object({
  redeemCode: RedeemCodeSchema,
})

export const TransferPackSchema = Type.Object({
  userExternalId: UserExternalIdSchema,
  packId: IdSchema,
})

export const TransferPackStatusSchema = Type.Object({
  collectibleId: IdSchema,
  status: Type.Optional(Type.Enum(AlgorandTransactionStatus)),
})

export const TransferPackStatusListSchema = Type.Object({
  status: Type.Array(TransferPackStatusSchema),
})

export const PackWithCollectiblesSchema = Type.Intersect([
  PackWithIdSchema,
  Type.Object({
    collectibles: Type.Array(CollectibleWithDetailsSchema),
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
export type PackSlug = Simplify<Static<typeof PackSlugSchema>>
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
export type RedeemCode = Simplify<Static<typeof RedeemObjectCodeSchema>>
export type RevokePack = Simplify<Static<typeof RevokePackSchema>>
export type TransferPack = Simplify<Static<typeof TransferPackSchema>>
export type TransferPackStatus = Simplify<
  Static<typeof TransferPackStatusSchema>
>
export type TransferPackStatusList = Simplify<
  Static<typeof TransferPackStatusListSchema>
>
