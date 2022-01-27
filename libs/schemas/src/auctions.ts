import { Static, Type } from '@sinclair/typebox'

import { PassphraseSchema } from './accounts'
import { ExternalIdSchema, Simplify } from './shared'

export const CreateAuctionBodySchema = Type.Intersect([
  ExternalIdSchema,
  PassphraseSchema,
  Type.Object({
    collectibleId: Type.String({ format: 'uuid' }),
    reservePrice: Type.Integer({ minimum: 0 }),
    startAt: Type.String({ format: 'date-time' }),
    endAt: Type.String({ format: 'date-time' }),
  }),
])

export type CreateAuctionBody = Simplify<Static<typeof CreateAuctionBodySchema>>
