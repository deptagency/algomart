import { Static, Type } from '@sinclair/typebox'

import { LanguageObjectSchema, Simplify } from './shared'

export const TagSchema = Type.Object({
  slug: Type.String(),
  title: Type.String(),
})

export const TagsSchema = Type.Array(TagSchema)
export const TagQuerySchema = Type.String()
export const TagListQuerySchema = Type.Intersect([
  LanguageObjectSchema,
  Type.Object({
    slugs: Type.Array(Type.String()),
  }),
])

export const TagQueryObjectSchema = Type.Object({
  query: TagQuerySchema,
})

export type Tag = Simplify<Static<typeof TagSchema>>
export type Tags = Simplify<Static<typeof TagsSchema>>
export type TagQuery = Simplify<Static<typeof TagQueryObjectSchema>>
export type TagListQuery = Simplify<Static<typeof TagListQuerySchema>>
