import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, Simplify } from './shared'

export const CurrencySchema = Type.Object({
  base: Type.Number(),
  code: Type.String(),
  exponent: Type.Number(),
})

export const CurrencyConversionSchema = Type.Intersect([
  BaseSchema,
  Type.Object({
    sourceCurrency: Type.String(),
    targetCurrency: Type.String(),
    exchangeRate: Type.Number(),
  }),
])

export const CurrencyConversionListSchema = Type.Array(CurrencyConversionSchema)

export const GetCurrencyConversionSchema = Type.Object({
  sourceCurrency: Type.String(),
  targetCurrency: Type.Optional(Type.String()),
})

export type Currency = Simplify<Static<typeof CurrencySchema>>
export type CurrencyConversion = Simplify<
  Static<typeof CurrencyConversionSchema>
>
export type CurrencyConversionList = Simplify<
  Static<typeof CurrencyConversionListSchema>
>
export type GetCurrencyConversion = Simplify<
  Static<typeof GetCurrencyConversionSchema>
>
