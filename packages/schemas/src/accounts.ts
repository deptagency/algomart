import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, ExternalIdSchema, Simplify } from './shared'
import { AlgorandTransactionStatus } from './transactions'

export const AlgorandAccountSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    // Algorand Account public key (address) is a 58 character long Base 32 (RFC 4648) string
    address: Type.String({
      pattern: '^[A-Z2-7]{58}$',
      minLength: 58,
      maxLength: 58,
    }),
    creationTransactionId: Type.Optional(Type.String({ format: 'uuid' })),
    encryptedKey: Type.String(),
  }),
])

export const PassphraseSchema = Type.Object({
  passphrase: Type.String(),
})

export const UsernameSchema = Type.Object({
  username: Type.String(),
})

export const LegacyAccountSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  legacyEmail: Type.Optional(Type.String({ format: 'email' })),
  newAccountId: Type.Optional(Type.String({ format: 'uuid' })),
})

export const PublicLegacyAccountSchema = Type.Object({
  legacyEmail: Type.String({ format: 'email' }),
})

const BaseUserAccountSchema = Type.Intersect([
  ExternalIdSchema,
  UsernameSchema,
  Type.Object({
    email: Type.String({ format: 'email' }),
    locale: Type.String({
      minLength: 2,
      maxLength: 5,
      pattern: '[a-z]{2}(-[A-Z]{2})?',
    }), // 'en[-US]?
  }),
])

export const CreateUserAccountRequestSchema = Type.Intersect([
  BaseUserAccountSchema,
  PassphraseSchema,
])

export const UpdateUserAccountSchema = Type.Object({
  email: Type.Optional(Type.String()),
  showProfile: Type.Optional(Type.Boolean()),
  username: Type.Optional(Type.String()),
})

export const PublicUserAccountSchema = Type.Intersect([
  BaseUserAccountSchema,
  Type.Object({
    address: Type.String(),
    status: Type.Optional(Type.Enum(AlgorandTransactionStatus)),
    showProfile: Type.Boolean(),
  }),
])

export const UserAccountSchema = Type.Intersect([
  BaseSchema,
  BaseUserAccountSchema,
  Type.Object({
    algorandAccountId: Type.String({ format: 'uuid' }),
  }),
])

export type AlgorandAccount = Simplify<Static<typeof AlgorandAccountSchema>>
export type CreateUserAccountRequest = Simplify<
  Static<typeof CreateUserAccountRequestSchema>
>
export type Passphrase = Simplify<Static<typeof PassphraseSchema>>
export type PublicAccount = Simplify<Static<typeof PublicUserAccountSchema>>
export type PublicLegacyAccount = Simplify<
  Static<typeof PublicLegacyAccountSchema>
>
export type UserAccount = Simplify<Static<typeof UserAccountSchema>>
export type Username = Simplify<Static<typeof UsernameSchema>>
export type UpdateUserAccount = Simplify<Static<typeof UpdateUserAccountSchema>>
