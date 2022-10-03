import { Static, Type } from '@sinclair/typebox'

import { UsernameSchema } from './accounts'
import {
  BaseSchema,
  CurrencyAmountSchema,
  CurrencyCodeSchema,
  IdSchema,
  Simplify,
  UserExternalIdObjectSchema,
} from './shared'

export const BidBaseSchema = Type.Object({
  amount: CurrencyAmountSchema,
  packId: IdSchema,
})

export const BidPublicSchema = Type.Intersect([
  BidBaseSchema,
  UserExternalIdObjectSchema,
  Type.Object({
    id: IdSchema,
    createdAt: Type.String({ format: 'date-time' }),
    username: UsernameSchema,
  }),
])

export const CreateBidRequestSchema = Type.Intersect([
  BidBaseSchema,
  UserExternalIdObjectSchema,
  Type.Object({
    currency: CurrencyCodeSchema,
  }),
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
