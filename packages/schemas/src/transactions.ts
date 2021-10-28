import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, Nullable, Simplify } from './shared'

export enum AlgorandTransactionStatus {
  Pending = 'pending',
  Failed = 'failed',
  Confirmed = 'confirmed',
}

export const AlgorandTransactionSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    // Algorand Transaction ID (address) is a 52 character long Base 32 (RFC 4648) string
    address: Type.String({
      maxLength: 52,
      minLength: 52,
      pattern: '^[A-Z2-7]{52}$',
    }),
    error: Type.Optional(Nullable(Type.String())),
    groupId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
    status: Type.Optional(Type.Enum(AlgorandTransactionStatus)),
  }),
])

export type AlgorandTransaction = Simplify<
  Static<typeof AlgorandTransactionSchema>
>
export const AlgorandTransactionGroupSchema = Type.Intersect([BaseSchema])
