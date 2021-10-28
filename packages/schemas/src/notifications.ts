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
  TransferSuccess = 'tranfer-success',
  UserHighBid = 'user-high-bid',
  UserOutbid = 'user-outbid',
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
