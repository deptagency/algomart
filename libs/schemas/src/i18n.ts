import { Static, Type } from '@sinclair/typebox'

import { CurrencyCodeSchema, LanguageSchema, Simplify } from './shared'

export const DropdownLanguageSchema = Type.Object({
  languages_code: LanguageSchema,
  label: Type.String(),
})

export const DropdownLanguageListSchema = Type.Array(DropdownLanguageSchema)

export const CurrencyConversionSchema = Type.Object({
  sourceCurrency: CurrencyCodeSchema,
  targetCurrency: CurrencyCodeSchema,
  exchangeRate: Type.Number(),
})

export const CurrencyConversionDictSchema = Type.Record(
  CurrencyCodeSchema,
  Type.Number()
)

export const CurrencyConversionResultSchema = Type.Object({
  createdAt: Type.String({ format: 'date-time' }),
  exchangeRate: Type.Number(),
  id: Type.String(),
  sourceCurrency: CurrencyCodeSchema,
  targetCurrency: CurrencyCodeSchema,
  updatedAt: Type.String({ format: 'date-time' }),
})

export const GetCurrencyConversionSchema = Type.Object({
  sourceCurrency: CurrencyCodeSchema,
})

export const GetCurrencyConversionsSchema = Type.Object({
  sourceCurrency: Type.Optional(CurrencyCodeSchema),
})

export const I18nInfoSchema = Type.Object({
  languages: DropdownLanguageListSchema,
  currencyConversions: CurrencyConversionDictSchema,
})

export type DropdownLanguage = Simplify<Static<typeof DropdownLanguageSchema>>
export type DropdownLanguageList = Simplify<
  Static<typeof DropdownLanguageListSchema>
>
export type CurrencyConversion = Simplify<
  Static<typeof CurrencyConversionSchema>
>
export type CurrencyConversionDict = Simplify<
  Static<typeof CurrencyConversionDictSchema>
>
export type CurrencyConversionResult = Simplify<
  Static<typeof CurrencyConversionResultSchema>
>
export type GetCurrencyConversion = Simplify<
  Static<typeof GetCurrencyConversionSchema>
>
export type GetCurrencyConversions = Simplify<
  Static<typeof GetCurrencyConversionsSchema>
>

export type I18nInfo = Simplify<Static<typeof I18nInfoSchema>>
