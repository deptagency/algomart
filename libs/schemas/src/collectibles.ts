import { Static, Type } from '@sinclair/typebox'

import { UsernameSchema } from './accounts'
import { CollectionBaseSchema, SetBaseSchema } from './collections'
import {
  AlgorandAccountAddressSchema,
  AlgorandAssetIndexSchema,
  AlgorandTransactionIdSchema,
  Base64Schema,
  BaseSchema,
  CurrencyAmountSchema,
  HexColorSchema,
  IdSchema,
  LanguageObjectSchema,
  LanguageSchema,
  Nullable,
  PageSchema,
  PageSizeSchema,
  PaginationSchema,
  RedeemCodeSchema,
  Simplify,
  SortDirection,
  UniqueCodeSchema,
  UserExternalIdSchema,
} from './shared'
import { TagSchema } from './tags'

export enum IPFSStatus {
  Pending = 'pending',
  Stored = 'stored',
}

export enum CollectibleAuctionStatus {
  New = 'new',
  SettingUp = 'setting-up',
  Active = 'active',
  Closing = 'closing',
  Closed = 'closed',
  Canceled = 'canceled',
}

export enum CollectibleListingType {
  FixedPrice = 'fixed-price',
  Auction = 'auction',
}

export enum CollectibleSortField {
  ClaimedAt = 'claimedAt',
  Title = 'title',
  Newest = 'newest',
  Oldest = 'oldest',
  Rarity = 'rarity',
}

export enum CollectibleListingsSortField {
  CreatedAt = 'createdAt',
  Title = 'title',
}

export enum CollectibleListingStatus {
  Active = 'active',
  Canceled = 'canceled',
  Reserved = 'reserved',
  TransferringCredits = 'transferring-credits',
  TransferringNFT = 'transferring-nft',
  Settled = 'settled',
}

export interface CollectibleMarketplaceTransactionState {
  inProgress: boolean
  successful: boolean
  error: boolean | string
}

export enum CollectibleActivityType {
  Mint = 'mint',
  List = 'list',
  Purchase = 'purchase',
  Transfer = 'transfer',
}

// 5.00 credits
export const MINIMUM_COLLECTIBLE_LISTING_PRICE = 500

export const AssetIdSchema = Type.Integer({ minimum: 1 })
export const AssetIdObjectSchema = Type.Object({
  assetId: AssetIdSchema,
})

export const CollectibleSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    address: Type.Optional(Nullable(AssetIdSchema)),
    claimedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    creationTransactionId: Type.Optional(
      Nullable(Type.String({ format: 'uuid' }))
    ),
    edition: Type.Optional(Nullable(Type.Integer({ minimum: 1 }))),
    latestTransferTransactionId: Type.Optional(
      Nullable(Type.String({ format: 'uuid' }))
    ),
    ownerId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    packId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    redemptionCode: Type.Optional(Nullable(RedeemCodeSchema)),
    templateId: Type.String({ format: 'uuid' }),
    assetMetadataHash: Type.Optional(Nullable(Base64Schema)),
    assetUrl: Type.Optional(Nullable(Type.String({ format: 'uri' }))),
    ipfsStatus: Type.Optional(Nullable(Type.Enum(IPFSStatus))),
  }),
])

export const CollectibleListingModelSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    buyerId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    claimedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    collectibleId: IdSchema,
    expiresAt: Type.Optional(Type.String({ format: 'date-time' })),
    price: Type.Integer({ minimum: MINIMUM_COLLECTIBLE_LISTING_PRICE }),
    purchasedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    sellerId: Type.Optional(Type.String({ format: 'uuid' })),
    status: Type.Enum(CollectibleListingStatus),
    type: Type.Enum(CollectibleListingType),
  }),
])

export const CollectibleAuctionSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    collectibleId: IdSchema,
    userAccountId: IdSchema,
    reservePrice: Type.Integer({ minimum: 0 }),
    startAt: Type.String({ format: 'date-time' }),
    endAt: Type.String({ format: 'date-time' }),
    status: Type.Enum(CollectibleAuctionStatus),
    appId: Type.Optional(Nullable(Type.Integer({ minimum: 1 }))),
    transactionId: Type.String({ format: 'uuid' }),
  }),
])

export const CollectibleAuctionBidSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    collectibleAuctionId: IdSchema,
    amount: Type.Integer({ minimum: 0 }),
    userAccountId: IdSchema,
    transactionId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
  }),
])

export const CollectibleRaritySchema = Type.Object({
  code: Type.String(),
  color: HexColorSchema,
  name: Type.String(),
})

export const CollectibleBaseSchema = Type.Object({
  templateId: Type.String({ format: 'uuid' }),
  image: Type.Optional(Type.String({ format: 'uri' })),
  previewVideo: Type.Optional(Type.String({ format: 'uri' })),
  previewAudio: Type.Optional(Type.String({ format: 'uri' })),
  assetFile: Type.Optional(Type.String({ format: 'uri' })),
  totalEditions: Type.Optional(Type.Integer({ minimum: 0 })),
  title: Type.Optional(Type.String()),
  subtitle: Type.Optional(Type.String()),
  body: Type.Optional(Type.String()),
  uniqueCode: Type.Optional(UniqueCodeSchema),
  collectionId: Type.Optional(Type.String({ format: 'uuid' })),
  collection: Type.Optional(CollectionBaseSchema),
  setId: Type.Optional(Type.String({ format: 'uuid' })),
  rarity: Type.Optional(CollectibleRaritySchema),
  tags: Type.Optional(Type.Array(TagSchema)),
})

export const CollectibleActivityUserSchema = Type.Object({
  username: Type.Optional(UsernameSchema),
  address: AlgorandAccountAddressSchema,
})

export const CollectibleActivitySchema = Type.Object({
  type: Type.Enum(CollectibleActivityType),
  date: Type.String({ format: 'date-time' }),
  sender: Type.Optional(CollectibleActivityUserSchema),
  recipient: Type.Optional(CollectibleActivityUserSchema),
  amount: Type.Optional(CurrencyAmountSchema),
})

export const CollectibleWithDetailsSchema = Type.Intersect([
  CollectibleBaseSchema,
  Type.Object({
    address: Type.Optional(AlgorandAssetIndexSchema),
    claimedAt: Type.Optional(Type.String({ format: 'date-time' })),
    collection: Type.Optional(CollectionBaseSchema),
    currentOwner: Type.Optional(UsernameSchema),
    currentOwnerAddress: Type.Optional(AlgorandAccountAddressSchema),
    edition: Type.Integer({ minimum: 1 }),
    id: Type.String({ format: 'uuid' }),
    isFrozen: Type.Optional(Type.Boolean()),
    listingId: Type.Optional(IdSchema),
    listingStatus: Type.Optional(Type.Enum(CollectibleListingStatus)),
    listingType: Type.Optional(Type.Enum(CollectibleListingType)),
    mintedAt: Type.Optional(Type.String({ format: 'date-time' })),
    price: Type.Optional(CurrencyAmountSchema),
    set: Type.Optional(SetBaseSchema),
    transferrableAt: Type.Optional(Type.String({ format: 'date-time' })),
    activities: Type.Optional(Type.Array(CollectibleActivitySchema)),
  }),
])

export const CollectibleOwnershipSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    collectibleId: Type.String({ format: 'uuid' }),
    ownerId: Type.String({ format: 'uuid' }),
  }),
])

export const CollectibleShowcaseSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    collectibleId: Type.String({ format: 'uuid' }),
    ownerId: Type.String({ format: 'uuid' }),
    order: Type.Integer({ minimum: 0 }),
  }),
])

export const CollectibleQuerySchema = Type.Intersect([
  LanguageObjectSchema,
  Type.Object({
    assetId: AssetIdSchema,
    externalId: Type.Optional(Type.String({ format: 'uuid' })),
    withActivities: Type.Optional(Type.Boolean()),
  }),
])

export const CollectiblesQuerySchema = Type.Object({
  page: Type.Optional(PageSchema),
  pageSize: Type.Optional(PageSizeSchema),
  language: Type.Optional(LanguageSchema),
  algoAddress: Type.Optional(AlgorandAccountAddressSchema),
  collectionIds: Type.Optional(Type.Array(IdSchema)),
  joinCurrentOwner: Type.Optional(Type.Boolean()),
  joinListings: Type.Optional(Type.Boolean()),
  joinTemplates: Type.Optional(Type.Boolean()),
  listingStatus: Type.Optional(Type.Array(Type.Enum(CollectibleListingStatus))),
  listingType: Type.Optional(Type.Array(Type.Enum(CollectibleListingType))),
  username: Type.Optional(UsernameSchema),
  userExternalId: Type.Optional(UserExternalIdSchema),
  priceLow: Type.Optional(CurrencyAmountSchema),
  priceHigh: Type.Optional(CurrencyAmountSchema),
  setIds: Type.Optional(Type.Array(IdSchema)),
  sortBy: Type.Optional(
    Type.Enum(CollectibleSortField, {
      default: CollectibleSortField.ClaimedAt,
    })
  ),
  sortDirection: Type.Optional(
    Type.Enum(SortDirection, { default: SortDirection.Ascending })
  ),
  templateIds: Type.Optional(Type.Array(IdSchema)),
})

export const CollectibleListingsQuerySchema = Type.Intersect([
  PaginationSchema,
  LanguageObjectSchema,
  Type.Object({
    listingStatus: Type.Optional(
      Type.Array(Type.Enum(CollectibleListingStatus))
    ),
    listingType: Type.Optional(Type.Array(Type.Enum(CollectibleListingType))),
    priceLow: Type.Optional(Type.Number()),
    priceHigh: Type.Optional(Type.Number()),
    tags: Type.Optional(Type.Array(Type.String())),
    sortBy: Type.Optional(
      Type.Enum(CollectibleListingsSortField, {
        default: CollectibleListingsSortField.CreatedAt,
      })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Ascending })
    ),
  }),
])

export const CollectibleListingSchema = Type.Intersect([
  CollectibleBaseSchema,
  BaseSchema,
  Type.Object({
    price: CurrencyAmountSchema,
    edition: Type.Integer({ minimum: 1 }),
  }),
])

export const CollectibleShowcaseQuerySchema = Type.Intersect([
  LanguageObjectSchema,
  Type.Object({
    ownerUsername: Type.Optional(UsernameSchema),
  }),
])

export const CollectibleIdSchema = Type.Object({
  collectibleId: IdSchema,
})

export const CollectibleUniqueCodeSchema = Type.Object({
  uniqueCode: UniqueCodeSchema,
})

export const CollectibleTemplateIdQuerySchema = Type.Intersect([
  LanguageObjectSchema,
  Type.Object({
    templateId: IdSchema,
  }),
])

export const CollectibleTemplateUniqueCodeQuerySchema = Type.Intersect([
  LanguageObjectSchema,
  Type.Object({
    uniqueCode: UniqueCodeSchema,
  }),
])

export const CollectiblesResponseSchema = Type.Object({
  total: Type.Integer({ minimum: 0 }),
  collectibles: Type.Array(CollectibleWithDetailsSchema),
})

export const CollectibleListingsResponseSchema = Type.Object({
  total: Type.Integer({ minimum: 0 }),
  collectibleListings: Type.Array(CollectibleListingSchema),
})

export const CollectiblesShowcaseSchema = Type.Object({
  showProfile: Type.Boolean(),
  collectibles: Type.Array(CollectibleWithDetailsSchema),
})

export const InitializeTransferCollectibleSchema = Type.Object({
  assetIndex: AlgorandAssetIndexSchema,
  address: AlgorandAccountAddressSchema,
  userExternalId: UserExternalIdSchema,
})

export const WalletTransactionMultisigMetadataSchema = Type.Object({
  version: Type.Integer(),
  threshold: Type.Integer(),
  addrs: Type.Array(Type.String()),
})

export const WalletTransactionSchema = Type.Object({
  authAddr: Type.Optional(AlgorandAccountAddressSchema),
  groupMessage: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
  signers: Type.Optional(Type.Array(AlgorandAccountAddressSchema)),
  stxn: Type.Optional(Base64Schema),
  txn: Base64Schema,
  txID: AlgorandTransactionIdSchema,
  msig: Type.Optional(WalletTransactionMultisigMetadataSchema),
})

export const TransferCollectibleSchema = Type.Intersect([
  InitializeTransferCollectibleSchema,
  Type.Object({
    transactionId: AlgorandTransactionIdSchema,
    signedTransaction: Base64Schema,
  }),
])

export const EncodedTransactionSchema = Type.Object({
  txn: Base64Schema,
  txnId: AlgorandTransactionIdSchema,
  signer: AlgorandAccountAddressSchema,
  signedTxn: Type.Optional(Base64Schema),
})

export const TransferCollectibleResultSchema = Type.Array(
  EncodedTransactionSchema
)

export const ListCollectibleForSaleSchema = Type.Object({
  collectibleId: Type.String({ format: 'uuid' }),
  price: CurrencyAmountSchema,
})

export const DelistCollectibleSchema = Type.Object({
  listingId: IdSchema,
})

export type Collectible = Simplify<Static<typeof CollectibleSchema>>
export type CollectibleAuction = Simplify<
  Static<typeof CollectibleAuctionSchema>
>
export type CollectibleAuctionBid = Simplify<
  Static<typeof CollectibleAuctionBidSchema>
>
export type CollectibleOwnership = Simplify<
  Static<typeof CollectibleOwnershipSchema>
>
export type CollectibleShowcase = Simplify<
  Static<typeof CollectibleShowcaseSchema>
>
export type CollectibleBase = Simplify<Static<typeof CollectibleBaseSchema>>
export type CollectibleRarity = Simplify<Static<typeof CollectibleRaritySchema>>
export type CollectibleWithDetails = Simplify<
  Static<typeof CollectibleWithDetailsSchema>
>
export type AssetIdObject = Simplify<Static<typeof AssetIdObjectSchema>>
export type CollectibleActivity = Simplify<
  Static<typeof CollectibleActivitySchema>
>
export type CollectibleActivityUser = Simplify<
  Static<typeof CollectibleActivityUserSchema>
>
export type CollectiblesQuery = Simplify<Static<typeof CollectiblesQuerySchema>>
export type CollectiblesResponse = Simplify<
  Static<typeof CollectiblesResponseSchema>
>
export type CollectibleListingsQuery = Simplify<
  Static<typeof CollectibleListingsQuerySchema>
>
export type CollectibleListingsResponse = Simplify<
  Static<typeof CollectibleListingsResponseSchema>
>
export type CollectibleListing = Simplify<
  Static<typeof CollectibleListingSchema>
>
export type CollectibleShowcaseQuery = Simplify<
  Static<typeof CollectibleShowcaseQuerySchema>
>
export type CollectibleId = Simplify<Static<typeof CollectibleIdSchema>>
export type CollectibleUniqueCode = Simplify<
  Static<typeof CollectibleUniqueCodeSchema>
>
export type CollectibleTemplateIdQuery = Simplify<
  Static<typeof CollectibleTemplateIdQuerySchema>
>
export type CollectibleTemplateUniqueCodeQuery = Simplify<
  Static<typeof CollectibleTemplateUniqueCodeQuerySchema>
>
export type CollectiblesShowcase = Simplify<
  Static<typeof CollectiblesShowcaseSchema>
>
export type CollectibleQuery = Simplify<Static<typeof CollectibleQuerySchema>>
export type InitializeTransferCollectible = Simplify<
  Static<typeof InitializeTransferCollectibleSchema>
>
export type TransferCollectible = Simplify<
  Static<typeof TransferCollectibleSchema>
>
export type TransferCollectibleResult = Simplify<
  Static<typeof TransferCollectibleResultSchema>
>
export type EncodedTransaction = Simplify<
  Static<typeof EncodedTransactionSchema>
>
export type ListCollectibleForSale = Simplify<
  Static<typeof ListCollectibleForSaleSchema>
>
export type DelistCollectible = Simplify<Static<typeof DelistCollectibleSchema>>
export type ListingInfo = Simplify<Static<typeof CollectibleListingModelSchema>>
