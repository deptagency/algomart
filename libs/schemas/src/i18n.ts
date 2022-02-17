import { Static, Type } from '@sinclair/typebox'

import { BaseSchema, Simplify } from './shared'

export const LanguageSchema = Type.Object({
  languages_code: Type.String(),
  label: Type.String(),
})

export const LanguageListSchema = Type.Array(LanguageSchema)

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

export const CurrencyConversionDictSchema = Type.Record(
  Type.String(),
  Type.Number()
)

export const GetCurrencyConversionSchema = Type.Object({
  sourceCurrency: Type.String(),
  targetCurrency: Type.Optional(Type.String()),
})

export const I18nInfoSchema = Type.Object({
  languages: LanguageListSchema,
  currencyConversions: CurrencyConversionDictSchema,
})

export type Language = Simplify<Static<typeof LanguageSchema>>
export type LanguageList = Simplify<Static<typeof LanguageListSchema>>

export type Currency = Simplify<Static<typeof CurrencySchema>>
export type CurrencyConversion = Simplify<
  Static<typeof CurrencyConversionSchema>
>
export type CurrencyConversionDict = Simplify<
  Static<typeof CurrencyConversionDictSchema>
>
export type GetCurrencyConversion = Simplify<
  Static<typeof GetCurrencyConversionSchema>
>

export type I18nInfo = Simplify<Static<typeof I18nInfoSchema>>
