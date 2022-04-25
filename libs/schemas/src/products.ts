import { Static, Type } from '@sinclair/typebox'

import { IdSchema, PaginationSchema, Simplify, SortDirection } from './shared'

export enum ProductStatus {
  Upcoming = 'Upcoming',
  Active = 'Active',
  Expired = 'Expired',
}

export enum ProductType {
  Auction = 'auction',
  Free = 'free',
  Purchase = 'purchase',
  Redeem = 'redeem',
}

export enum ProductSortField {
  ReleasedAt = 'releasedAt',
  Title = 'name',
}

export const ProductSchema = Type.Object({
  activeBid: Type.Optional(Type.Number()),
  auctionUntil: Type.Optional(Type.String({ format: 'date-time' })),
  available: Type.Number(),
  body: Type.Optional(Type.String()),
  collectibleId: Type.Optional(IdSchema),
  image: Type.String({ format: 'uri' }),
  packSlug: Type.String(),
  price: Type.Number(),
  releasedAt: Type.Optional(Type.String({ format: 'date-time' })),
  status: Type.Enum(ProductStatus),
  subtitle: Type.Optional(Type.String()),
  title: Type.String(),
  total: Type.Number(),
  type: Type.Enum(ProductType),
})

export const ProductsSchema = Type.Object({
  products: Type.Array(ProductSchema),
  total: Type.Number(),
})

export const ProductQuerySchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    currency: Type.Optional(Type.String()),
    language: Type.Optional(Type.String()),
    slug: Type.Optional(Type.String()),
    templateIds: Type.Optional(Type.Array(IdSchema)),
    priceLow: Type.Optional(Type.Number()),
    priceHigh: Type.Optional(Type.Number()),
    type: Type.Optional(Type.Array(Type.Enum(ProductType))),
    secondaryMarket: Type.Optional(Type.Boolean()),
    status: Type.Optional(Type.Array(Type.Enum(ProductStatus))),
    reserveMet: Type.Optional(Type.Boolean()),
    sortBy: Type.Optional(
      Type.Enum(ProductSortField, { default: ProductSortField.ReleasedAt })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Ascending })
    ),
  }),
])

export type Product = Simplify<Static<typeof ProductSchema>>
export type Products = Simplify<Static<typeof ProductsSchema>>
export type ProductQuery = Simplify<Static<typeof ProductQuerySchema>>
