import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, ExternalIdSchema, IdSchema, Simplify } from './shared'

export const BidBaseSchema = Type.Object({
  amount: Type.Integer({ minimum: 0 }),
  packId: IdSchema,
})

export const BidPublicSchema = Type.Intersect([
  BidBaseSchema,
  ExternalIdSchema,
  Type.Object({
    id: IdSchema,
    createdAt: Type.String(),
    username: Type.String(),
  }),
])

export const CreateBidRequestSchema = Type.Intersect([
  BidBaseSchema,
  ExternalIdSchema,
])

export const BidSchema = Type.Intersect([
  BaseSchema,
  BidBaseSchema,
  Type.Object({
    userAccountId: IdSchema,
  }),
])

export type Bid = Simplify<Static<typeof BidSchema>>
export type BidPublic = Simplify<Static<typeof BidPublicSchema>>
export type CreateBidRequest = Simplify<Static<typeof CreateBidRequestSchema>>
