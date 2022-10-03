import { Static, Type } from '@sinclair/typebox'

import { Simplify, SlugSchema } from './shared'

export const SetBaseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  slug: SlugSchema,
  collectibleTemplateIds: Type.Array(Type.String({ format: 'uuid' })),
})

export const TagBaseSchema = Type.Object({
  slug: SlugSchema,
  title: Type.String(),
})

export const CollectionRewardSchema = Type.Object({
  prompt: Type.String(),
  complete: Type.String(),
  image: Type.Optional(Type.String({ type: 'uri' })),
})

export const CollectionBaseSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean()])
    )
  ),
  reward: Type.Optional(CollectionRewardSchema),
  image: Type.Optional(Type.String({ type: 'uri' })),
  slug: SlugSchema,
  collectibleTemplateIds: Type.Array(Type.String({ format: 'uuid' })),
})

export const SetWithCollectionSchema = Type.Intersect([
  SetBaseSchema,
  Type.Object({
    collection: CollectionBaseSchema,
  }),
])

export const CollectionWithSetsSchema = Type.Intersect([
  CollectionBaseSchema,
  Type.Object({
    sets: Type.Array(SetBaseSchema),
  }),
])

export type SetBase = Simplify<Static<typeof SetBaseSchema>>
export type TagBase = Simplify<Static<typeof TagBaseSchema>>
export type CollectionReward = Simplify<Static<typeof CollectionRewardSchema>>
export type CollectionBase = Simplify<Static<typeof CollectionBaseSchema>>
export type CollectionWithSets = Simplify<
  Static<typeof CollectionWithSetsSchema>
>
export type SetWithCollection = Simplify<Static<typeof SetWithCollectionSchema>>
