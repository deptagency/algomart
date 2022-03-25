import { Static, Type } from '@sinclair/typebox'

import { PassphraseSchema } from './accounts'
import { CollectibleAuctionStatus } from './collectibles'
import { ExternalIdSchema, Simplify } from './shared'

export const CreateAuctionBodySchema = Type.Intersect([
  ExternalIdSchema,
  Type.Object({
    collectibleId: Type.String({ format: 'uuid' }),
    reservePrice: Type.Integer({ minimum: 0 }),
    durationInHours: Type.Integer({ minimum: 1 }),
  }),
])

export const CreateAuctionResponseSchema = Type.Object({
  auctionId: Type.String({ format: 'uuid' }),
  collectibleId: Type.String({ format: 'uuid' }),
  status: Type.Enum(CollectibleAuctionStatus),
  startAt: Type.String({ format: 'date-time' }),
  endAt: Type.String({ format: 'date-time' }),
  transactionId: Type.String(),
})

export const SetupAuctionBodySchema = Type.Intersect([
  ExternalIdSchema,
  PassphraseSchema,
  Type.Object({
    auctionId: Type.String({ format: 'uuid' }),
  }),
])

export const SetupAuctionResponseSchema = Type.Object({
  auctionId: Type.String({ format: 'uuid' }),
  status: Type.Enum(CollectibleAuctionStatus),
  transactionIds: Type.Array(Type.String()),
})

export type CreateAuctionBody = Simplify<Static<typeof CreateAuctionBodySchema>>
export type CreateAuctionResponse = Simplify<
  Static<typeof CreateAuctionResponseSchema>
>
export type SetupAuctionBody = Simplify<Static<typeof SetupAuctionBodySchema>>
export type SetupAuctionResponse = Simplify<
  Static<typeof SetupAuctionResponseSchema>
>
