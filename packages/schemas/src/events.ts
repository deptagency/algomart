import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, Nullable, Simplify } from './shared'

export enum EventAction {
  Create = 'create',
  Delete = 'delete',
  Update = 'update',
}

export enum EventEntityType {
  AlgorandAccount = 'algorand-account',
  AlgorandTransaction = 'algorand-transaction',
  AlgorandTransactionGroup = 'algorand-transaction-group',
  Bid = 'bid',
  Collectible = 'collectible',
  CollectibleOwnership = 'collectible-ownership',
  CollectibleShowcase = 'collectible-showcase',
  Notification = 'notification',
  Pack = 'pack',
  Payment = 'payment',
  PaymentCard = 'payment-card',
  UserAccount = 'user-account',
}

export const EventSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    action: Type.Enum(EventAction),
    entityId: Type.String({ format: 'uuid' }),
    entityType: Type.Enum(EventEntityType),
    userAccountId: Type.Optional(Nullable(Type.String({ format: 'uuid' }))),
  }),
])

export type Event = Simplify<Static<typeof EventSchema>>
