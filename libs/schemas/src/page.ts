import { Static, Type } from '@sinclair/typebox'

import { Simplify } from './shared'

export const PageSchema = Type.Object({
  id: Type.String(),
  slug: Type.String(),
  title: Type.String(),
  body: Type.String(),
})

export type Page = Simplify<Static<typeof PageSchema>>
