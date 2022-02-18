import { Static, Type } from '@sinclair/typebox'

import { CollectibleBaseSchema } from './collectibles'
import { PackBaseSchema, PublishedPackSchema } from './packs'
import { Simplify } from './shared'

export const HomepageTranslationsSchema = Type.Object({
  featuredNftsSubtitle: Type.Optional(Type.String()),
  featuredNftsTitle: Type.Optional(Type.String()),
  featuredPacksSubtitle: Type.Optional(Type.String()),
  featuredPacksTitle: Type.Optional(Type.String()),
  heroBannerSubtitle: Type.Optional(Type.String()),
  heroBannerTitle: Type.Optional(Type.String()),
})

// export const HomepageBaseSchema = Type.Object({
//   featuredPack: Type.Optional(PackBaseSchema),
//   upcomingPacks: Type.Array(PackBaseSchema),
//   notableCollectibles: Type.Array(CollectibleBaseSchema),
// })

export const HomepageBaseSchema = Type.Intersect([
  Type.Object({
    featuredNftTemplateIds: Type.Array(Type.String({ format: 'uuid' })),
    featuredPackTemplateIds: Type.Array(Type.String({ format: 'uuid' })),
    heroBanner: Type.Optional(Type.String()),
    heroPackTemplateId: Type.Optional(Type.String({ format: 'uuid' })),
  }),
  HomepageTranslationsSchema,
])

export const HomepageSchema = Type.Intersect([
  Type.Object({
    heroBanner: Type.Optional(Type.String()),
    heroPack: Type.Optional(PublishedPackSchema),
    featuredPacks: Type.Array(PublishedPackSchema),
    featuredNfts: Type.Array(CollectibleBaseSchema),
  }),
  HomepageTranslationsSchema,
])

export type HomepageBase = Simplify<Static<typeof HomepageBaseSchema>>
export type Homepage = Simplify<Static<typeof HomepageSchema>>
