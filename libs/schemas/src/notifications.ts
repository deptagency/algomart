import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, Nullable, Simplify } from './shared'

export interface Email {
  to: string | string[]
  subject: string
  html: string
}

export enum NotificationStatus {
  Complete = 'complete',
  Failed = 'failed',
  Pending = 'pending',
}

export enum NotificationType {
  AuctionComplete = 'auction-complete',
  BidExpired = 'bid-expired',
  EmailPasswordReset = 'email-password-reset',
  NewEmailVerification = 'new-email-verification',
  PackRevoked = 'pack-revoked',
  PaymentFailed = 'payment-failed',
  PaymentSuccess = 'payment-success',
  ReportComplete = 'onfido-report-complete',
  SecondaryPurchaseSuccess = 'secondary-purchase-success',
  SecondarySaleSuccess = 'secondary-sale-success',
  TransferSuccess = 'transfer-success',
  UserHighBid = 'user-high-bid',
  UserOutbid = 'user-outbid',
  WorkflowComplete = 'onfido-workflow-complete',
  WorkflowCompleteManual = 'onfido-workflow-complete-manual',
  WorkflowCompleteRejected = 'onfido-workflow-complete-rejected',
  WirePayoutSubmitted = 'wire-payout-submitted',
  WirePayoutFailed = 'wire-payout-failed',
  WirePayoutReturned = 'wire-payout-returned',
}

export const CreateNotificationSchema = Type.Intersect([
  Type.Object({
    type: Type.Enum(NotificationType),
    userAccountId: Type.Optional(Type.String({ format: 'uuid' })),
    variables: Type.Optional(
      Nullable(
        Type.Record(
          Type.String(),
          Type.Union([Type.Boolean(), Type.Number(), Type.String()])
        )
      )
    ),
  }),
])

export const NotificationSchema = Type.Intersect([
  BaseSchema,
  CreateNotificationSchema,
  Type.Object({
    error: Type.Optional(Nullable(Type.String())),
    status: Type.Enum(NotificationStatus),
  }),
])

export type Notification = Simplify<Static<typeof NotificationSchema>>
export type CreateNotification = Simplify<
  Static<typeof CreateNotificationSchema>
>
