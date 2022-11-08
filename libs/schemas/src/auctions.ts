import { Static, Type } from '@sinclair/typebox'

import { CurrencyAmountSchema, Simplify, UserExternalIdSchema } from './shared'

export const CreateAuctionBodySchema = Type.Object({
  userExternalId: UserExternalIdSchema,
  collectibleId: Type.String({ format: 'uuid' }),
  reservePrice: CurrencyAmountSchema,
  startAt: Type.String({ format: 'date-time' }),
  endAt: Type.String({ format: 'date-time' }),
})

export type CreateAuctionBody = Simplify<Static<typeof CreateAuctionBodySchema>>
