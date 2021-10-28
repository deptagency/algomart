import { Static, TSchema, Type } from '@sinclair/typebox'

export const DEFAULT_CURRENCY = 'USD'
export const DEFAULT_LOCALE = 'en-US'

export const IdSchema = Type.String({ format: 'uuid' })

export const BaseSchema = Type.Object({
  createdAt: Type.Optional(Type.String({ format: 'date-time' })),
  id: Type.Optional(IdSchema),
  updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
})

export const ExternalIdSchema = Type.Object({
  externalId: Type.String(),
})

export const OwnerExternalIdSchema = Type.Object({
  ownerExternalId: Type.Optional(Type.String()),
})

export const PaginationSchema = Type.Object({
  page: Type.Optional(Type.Number({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(
    Type.Number({ minimum: -1, maximum: 100, default: 10 })
  ),
})

export const LocaleSchema = Type.Object({
  locale: Type.Optional(Type.String()),
})

export enum SortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

export enum SortOptions {
  Name = 'Name',
  Newest = 'Newest',
  Oldest = 'Oldest',
}

export const SlugSchema = Type.Object({
  slug: Type.String(),
})

export const Nullable = <T extends TSchema>(type: T) =>
  Type.Union([type, Type.Null()])

// From https://github.com/sindresorhus/type-fest/blob/main/source/simplify.d.ts
export type Simplify<T> = T extends unknown[]
  ? Array<Simplify<T[number]>>
  : { [KeyType in keyof T]: Simplify<T[KeyType]> }

export type Base = Simplify<Static<typeof BaseSchema>>
export type ExternalId = Simplify<Static<typeof ExternalIdSchema>>
export type OwnerExternalId = Simplify<Static<typeof OwnerExternalIdSchema>>
export type Pagination = Simplify<Static<typeof PaginationSchema>>
export type Slug = Simplify<Static<typeof SlugSchema>>
export type Locale = Simplify<Static<typeof LocaleSchema>>
