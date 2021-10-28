import { Static, Type } from '@sinclair/typebox'

import { CollectibleBaseSchema } from './collectibles'
import { PublishedPackSchema } from './packs'
import { Simplify } from './shared'

export const HomepageBaseSchema = Type.Object({
  featuredPackTemplateId: Type.Optional(Type.String({ format: 'uuid' })),
  upcomingPackTemplateIds: Type.Array(Type.String({ format: 'uuid' })),
  notableCollectibleTemplateIds: Type.Array(Type.String({ format: 'uuid' })),
})

export const HomepageSchema = Type.Object({
  featuredPack: Type.Optional(PublishedPackSchema),
  upcomingPacks: Type.Array(PublishedPackSchema),
  notableCollectibles: Type.Array(CollectibleBaseSchema),
})

export type HomepageBase = Simplify<Static<typeof HomepageBaseSchema>>
export type Homepage = Simplify<Static<typeof HomepageSchema>>
