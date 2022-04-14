import { Static, Type } from '@sinclair/typebox'

import {
  BaseSchema,
  ExternalIdSchema,
  Nullable,
  PaginationSchema,
  Simplify,
  SortDirection,
} from './shared'
import { AlgorandTransactionStatus } from './transactions'

export enum FirebaseClaim {
  admin = 'admin',
}

export enum StripeAllowedTypes {
  driving_license = 'driving_license',
  passport = 'passport',
  id_card = 'id_card',
}

export enum StripeVerificationType {
  document = 'document',
  id_number = 'id_number',
}

export enum StripeStatus {
  requires_input = 'requires_input',
  processing = 'processing',
  verified = 'verified',
  canceled = 'canceled',
}

export enum StripeLastErrorCode {
  consent_declined = 'consent_declined',
  device_not_supported = 'device_not_supported',
  abandoned = 'abandoned',
  under_supported_age = 'under_supported_age',
  country_not_supported = 'country_not_supported',
  document_expired = 'document_expired',
  document_unverified_other = 'document_unverified_other',
  document_type_not_supported = 'document_type_not_supported',
  selfie_document_missing_photo = 'selfie_document_missing_photo',
  selfie_face_mismatch = 'selfie_face_mismatch',
  selfie_unverified_other = 'selfie_unverified_other',
  selfie_manipulated = 'selfie_manipulated',
  id_number_unverified_other = 'id_number_unverified_other',
  id_number_insufficient_document_data = 'id_number_insufficient_document_data',
  id_number_mismatch = 'id_number_mismatch',
}

export const AdminPermissionsSchema = Type.Object({
  claims: Type.Array(Type.Enum(FirebaseClaim)),
})

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

const BaseUserAccountSchema = Type.Intersect([
  ExternalIdSchema,
  UsernameSchema,
  Type.Object({
    email: Type.String({ format: 'email' }),
    currency: Type.String(),
    language: Type.String({
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
  language: Type.Optional(Type.String()),
  currency: Type.Optional(Type.String()),
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
    claims: Type.Optional(Type.Array(Type.String())),
  }),
])

export const StripeVerificationBaseSchema = Type.Object({
  type: Type.Enum(StripeVerificationType),
  metadata: Type.Optional(
    Type.Object({
      internalId: Type.Optional(Type.String()),
    })
  ),
  options: Type.Optional(
    Type.Object({
      document: Type.Optional(
        Type.Object({
          allowed_types: Type.Optional(Type.Enum(StripeAllowedTypes)),
          required_id_number: Type.Optional(Type.String()),
          require_live_capture: Type.Optional(Type.Boolean()),
          require_matching_selfie: Type.Optional(Type.Boolean()),
        })
      ),
    })
  ),
  return_url: Type.Optional(Type.String({ format: 'uri' })),
})

export const CreateVerificationSessionRequestSchema =
  StripeVerificationBaseSchema

export const CreateVerificationSessionSchema = Type.Intersect([
  StripeVerificationBaseSchema,
  Type.Object({
    id: Type.String(),
    object: Type.String(),
    client_secret: Type.Optional(Nullable(Type.String())),
    created: Type.String({ format: 'date-time' }),
    last_error: Type.Optional(
      Type.Union([
        Type.String(),
        Type.Null(),
        Type.Object({
          code: Type.Enum(StripeLastErrorCode),
          reason: Type.String(),
        }),
      ])
    ),
    last_verification_report: Type.Optional(
      Type.Union([Type.String(), Type.Null(), Type.Object({})])
    ),
    status: Type.Enum(StripeStatus),
    verified_outputs: Type.Optional(Type.String({ format: 'uri' })),
  }),
])

export type AlgorandAccount = Simplify<Static<typeof AlgorandAccountSchema>>
export type AdminPermissions = Simplify<Static<typeof AdminPermissionsSchema>>
export type CreateVerificationSession = Simplify<
  Static<typeof CreateVerificationSessionSchema>
>
export type CreateVerificationSessionRequest = Simplify<
  Static<typeof CreateVerificationSessionRequestSchema>
>
export type CreateUserAccountRequest = Simplify<
  Static<typeof CreateUserAccountRequestSchema>
>
export type Passphrase = Simplify<Static<typeof PassphraseSchema>>
export type PublicAccount = Simplify<Static<typeof PublicUserAccountSchema>>
export type UserAccount = Simplify<Static<typeof UserAccountSchema>>
export type Username = Simplify<Static<typeof UsernameSchema>>
export type UpdateUserAccount = Simplify<Static<typeof UpdateUserAccountSchema>>

export const UserAccountsSchema = Type.Object({
  users: Type.Array(UserAccountSchema),
  total: Type.Number(),
})
export type UserAccounts = Simplify<Static<typeof UserAccountsSchema>>

export enum UserSortField {
  Username = 'username',
  Email = 'email',
  CreatedAt = 'createdAt',
}

export const UsersQuerystringSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    search: Type.Optional(Type.String()),
    sortBy: Type.Optional(
      Type.Enum(UserSortField, { default: UserSortField.CreatedAt })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Descending })
    ),
  }),
])
export type UsersQuerystring = Simplify<Static<typeof UsersQuerystringSchema>>
