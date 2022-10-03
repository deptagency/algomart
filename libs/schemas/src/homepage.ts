import { Static, Type } from '@sinclair/typebox'

import { CollectibleBaseSchema } from './collectibles'
import { FaqSchema } from './faqs'
import { PackBaseSchema, PublishedPackSchema } from './packs'
import { RarityBaseSchema, Simplify } from './shared'

export enum HeroBannerType {
  Video = 'video',
  Image = 'image',
}

export const HomepageTranslationsSchema = Type.Object({
  featuredNftsSubtitle: Type.Optional(Type.String()),
  featuredNftsTitle: Type.Optional(Type.String()),
  featuredPacksSubtitle: Type.Optional(Type.String()),
  featuredPacksTitle: Type.Optional(Type.String()),
  heroBannerSubtitle: Type.Optional(Type.String()),
  heroBannerTitle: Type.Optional(Type.String()),
})

export const HomepageBaseSchema = Type.Intersect([
  Type.Object({
    heroBanner: Type.Optional(Type.String()),
    heroBannerType: Type.Optional(Type.Enum(HeroBannerType)),
    featuredFaqs: Type.Array(FaqSchema),
    featuredNftTemplates: Type.Array(CollectibleBaseSchema),
    featuredPackTemplates: Type.Array(PackBaseSchema),
    featuredRarities: Type.Array(RarityBaseSchema),
    heroPackTemplate: Type.Optional(PackBaseSchema),
  }),
  HomepageTranslationsSchema,
])

export const HomepageSchema = Type.Intersect([
  Type.Object({
    heroBanner: Type.Optional(Type.String()),
    heroBannerType: Type.Optional(Type.Enum(HeroBannerType)),
    heroPack: Type.Optional(PublishedPackSchema),
    featuredFaqs: Type.Array(FaqSchema),
    featuredPacks: Type.Array(PublishedPackSchema),
    featuredNfts: Type.Array(CollectibleBaseSchema),
    featuredRarities: Type.Array(RarityBaseSchema),
  }),
  HomepageTranslationsSchema,
])

export type HomepageBase = Simplify<Static<typeof HomepageBaseSchema>>
export type Homepage = Simplify<Static<typeof HomepageSchema>>
