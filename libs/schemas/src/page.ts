import { Static, Type } from '@sinclair/typebox'

import { Simplify, SlugSchema } from './shared'

export const PageTranslationsSchema = Type.Object({
  title: Type.String(),
  body: Type.String(),
  heroBannerTitle: Type.Optional(Type.String()),
  heroBannerSubtitle: Type.Optional(Type.String()),
})

export const PageBaseSchema = Type.Intersect([
  Type.Object({
    id: Type.String(),
    slug: SlugSchema,
    heroBanner: Type.Optional(Type.String()),
  }),
  PageTranslationsSchema,
])

export type Page = Simplify<Static<typeof PageBaseSchema>>
