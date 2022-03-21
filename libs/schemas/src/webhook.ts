import { Static, Type } from '@sinclair/typebox'

import { Simplify } from './shared'

export const DirectusWebhookSchema = Type.Object({
  collection: Type.String(),
  event: Type.String(),
  key: Type.Optional(Type.String()),
  keys: Type.Optional(Type.Array(Type.String())),
})

export type DirectusWebhook = Simplify<Static<typeof DirectusWebhookSchema>>
