import { Static, Type } from '@sinclair/typebox'

import { Nullable, Simplify } from './shared'

export const BrandSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  slug: Type.String(),
  logo: Type.Optional(Nullable(Type.String({ format: 'uri' }))),
  banner: Type.Optional(Nullable(Type.String({ format: 'uri' }))),
})

export const BrandListSchema = Type.Array(BrandSchema)

export const BrandListWithTotalSchema = Type.Object({
  total: Type.Number(),
  brands: BrandListSchema,
})

export type Brand = Simplify<Static<typeof BrandSchema>>
export type Brands = Simplify<Static<typeof BrandListSchema>>
export type BrandListWithTotal = Simplify<
  Static<typeof BrandListWithTotalSchema>
>
