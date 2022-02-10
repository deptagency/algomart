import { Static, Type } from '@sinclair/typebox'

import { Simplify } from './shared'

export const DirectusPageSchema = Type.Object({
  title: Type.String(),
  body: Type.String(),
})

export type DirectusPage = Simplify<Static<typeof DirectusPageSchema>>
