import { Static, Type } from '@sinclair/typebox'

import {
  BaseSchema,
  IdSchema,
  LocaleSchema,
  Nullable,
  PaginationSchema,
  Simplify,
  SortDirection,
} from './shared'

export const CollectibleSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    address: Type.Optional(Nullable(Type.Number())),
    claimedAt: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
    creationTransactionId: Type.Optional(
      Nullable(Type.String({ format: 'uuid' }))
    ),
    edition: Type.Optional(Nullable(Type.Number())),
    latestTransferTransactionId: Type.Optional(
      Nullable(Type.String({ format: 'uuid' }))
    ),
    ownerId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    packId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    redemptionCode: Type.Optional(Nullable(Type.String())),
    templateId: Type.String({ format: 'uuid' }),
  }),
])

export const CollectibleRaritySchema = Type.Object({
  code: Type.String(),
  color: Type.String(),
  name: Type.String(),
})

export const CollectibleBaseSchema = Type.Object({
  templateId: Type.String({ format: 'uuid' }),
  image: Type.String({ format: 'uri' }),
  previewVideo: Type.Optional(Type.String({ format: 'uri' })),
  totalEditions: Type.Number(),
  title: Type.String(),
  subtitle: Type.Optional(Type.String()),
  body: Type.Optional(Type.String()),
  uniqueCode: Type.String(),
  collectionId: Type.Optional(Type.String({ format: 'uuid' })),
  setId: Type.Optional(Type.String({ format: 'uuid' })),
  rarity: Type.Optional(CollectibleRaritySchema),
})

export const CollectibleWithDetailsSchema = Type.Intersect([
  CollectibleBaseSchema,
  Type.Object({
    id: Type.String({ format: 'uuid' }),
    edition: Type.Number(),
    address: Type.Optional(Type.Number()),
    claimedAt: Type.Optional(Type.String({ format: 'date-time' })),
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
    order: Type.Integer(),
  }),
])

export enum CollectibleSortField {
  ClaimedAt = 'claimedAt',
  Title = 'title',
}

export const CollectibleListQuerystringSchema = Type.Intersect([
  PaginationSchema,
  LocaleSchema,
  Type.Object({
    ownerUsername: Type.Optional(Type.String()),
    ownerExternalId: Type.Optional(Type.String()),
    sortBy: Type.Optional(
      Type.Enum(CollectibleSortField, { default: CollectibleSortField.Title })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Ascending })
    ),
    templateIds: Type.Optional(Type.Array(IdSchema)),
    setId: Type.Optional(IdSchema),
    collectionId: Type.Optional(IdSchema),
  }),
])

export const CollectibleShowcaseQuerystringSchema = Type.Intersect([
  LocaleSchema,
  Type.Object({
    ownerUsername: Type.String(),
  }),
])

export const CollectibleIdSchema = Type.Object({
  collectibleId: IdSchema,
})

export const CollectibleListSchema = Type.Array(CollectibleWithDetailsSchema)

export const CollectibleListWithTotalSchema = Type.Object({
  total: Type.Number(),
  collectibles: CollectibleListSchema,
})

export const CollectibleListShowcaseSchema = Type.Object({
  showProfile: Type.Boolean(),
  collectibles: CollectibleListSchema,
})

export type Collectible = Simplify<Static<typeof CollectibleSchema>>
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
export type CollectibleListQuerystring = Simplify<
  Static<typeof CollectibleListQuerystringSchema>
>
export type CollectibleShowcaseQuerystring = Simplify<
  Static<typeof CollectibleShowcaseQuerystringSchema>
>
export type CollectibleList = Simplify<Static<typeof CollectibleListSchema>>
export type CollectibleListWithTotal = Simplify<
  Static<typeof CollectibleListWithTotalSchema>
>
export type CollectibleId = Simplify<Static<typeof CollectibleIdSchema>>
export type CollectibleListShowcase = Simplify<
  Static<typeof CollectibleListShowcaseSchema>
>
