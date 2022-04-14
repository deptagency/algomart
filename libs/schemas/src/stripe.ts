import { Static, Type } from '@sinclair/typebox'
import { Stripe } from '@stripe/stripe-js'

// const 1 = Stripe.Identity.VerificationSession

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
  // Stripe.Identity.VerificationSession,
  Type.Object({
    id: Type.String(),
    object: Type.String(),
    // client_secret: Type.Optional(Nullable(Type.String())),
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
