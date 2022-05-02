import {
  CollectibleListQuerystring,
  GetCurrencyConversion,
  GetCurrencyConversions,
  PackBySlugQuery,
  PacksByOwnerQuery,
  PackStatus,
  PackType,
  PaymentsQuerystring,
  ProductQuery,
  ProductStatus,
  ProductType,
  PublishedPacksQuery,
  SortOptions,
  UsersQuerystring,
} from '@algomart/schemas'
import { Translate } from 'next-translate'
import { stringify } from 'query-string'

import { PAGE_SIZE } from '@/components/pagination/pagination'
import { SelectOption } from '@/components/select/select'
import { ProductFilterState } from '@/hooks/use-product-filter'

/**
 * Build a search parameter string to filter products
 */
export const searchProductsFilterQuery = (query: ProductQuery) => {
  return stringify({
    currency: query.currency,
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    priceHigh: query.priceHigh,
    priceLow: query.priceLow,
    reserveMet: query.reserveMet,
    secondaryMarket: query.secondaryMarket,
    slug: query.slug,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    templateIds: query.templateIds,
    status: query.status,
    type: query.type,
  })
}

/**
 * Build a search parameter string to filter published packs
 */
export const searchPublishedPacksFilterQuery = (query: PublishedPacksQuery) => {
  return stringify({
    currency: query.currency,
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    priceHigh: query.priceHigh,
    priceLow: query.priceLow,
    reserveMet: query.reserveMet,
    slug: query.slug,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    templateIds: query.templateIds,
    status: query.status,
    type: query.type,
  })
}

export const getPackBySlugFilterQuery = (query: PackBySlugQuery) => {
  return stringify({
    language: query.language,
    slug: query.slug,
  })
}

export const getPacksByOwnerFilterQuery = (query: PacksByOwnerQuery) => {
  return stringify({
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    templateIds: query.templateIds,
    slug: query.slug,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    type: query.type,
  })
}

/**
 * Formats a ProductQuery object from state of useFilterReducer
 */
export const getProductFilterQueryFromState = (
  language: string,
  state: ProductFilterState,
  currency: string
): ProductQuery => {
  const status: ProductStatus[] = []
  if (state.showAuctionExpired) status.push(ProductStatus.Expired)
  if (state.showAuctionActive) status.push(ProductStatus.Active)
  if (state.showAuctionUpcoming) status.push(ProductStatus.Upcoming)

  const type: ProductType[] = []
  if (state.showAuction) type.push(ProductType.Auction)
  if (state.showPurchase) type.push(ProductType.Purchase)

  return {
    language,
    currency,
    page: state.currentPage,
    priceHigh: state.priceHigh,
    priceLow: state.priceLow,
    reserveMet: state.showAuctionReserveMet,
    secondaryMarket: state.showSecondaryMarket,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,
    status,
    type,
  }
}

/**
 * Build a search parameter string to filter collectibles
 */
export const getCollectiblesFilterQuery = (
  query: CollectibleListQuerystring
) => {
  return stringify({
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    ownerUsername: query.ownerUsername,
    ownerExternalId: query.ownerExternalId,
    templateIds: query.templateIds,
    setId: query.setId,
    collectionId: query.collectionId,
  })
}

/**
 * Build a search parameter string to filter payments
 */
export const getPaymentsFilterQuery = (query: PaymentsQuerystring) => {
  return stringify({
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    packId: query.packId,
    packSlug: query.packSlug,
    payerExternalId: query.payerExternalId,
    payerUsername: query.payerUsername,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
  })
}

/**
 * Build selection options for sorting
 */
export function getSelectSortingOptions(t: Translate): SelectOption[] {
  return [
    { value: SortOptions.Newest, label: t('collection:sorting.Newest') },
    { value: SortOptions.Oldest, label: t('collection:sorting.Oldest') },
    // { value: SortOptions.Name, label: t('collection:sorting.Name') },
  ]
}

/**
 * Build a search parameter string to filter payments
 */
export const getUsersFilterQuery = (query: UsersQuerystring) => {
  return stringify({
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    search: query.search,
  })
}

export const getCurrencyConversionQuery = (params: GetCurrencyConversion) => {
  return stringify({
    sourceCurrency: params.sourceCurrency,
    targetCurrency: params.targetCurrency,
  })
}

export const getCurrencyConversionsQuery = (params: GetCurrencyConversions) => {
  return stringify({
    sourceCurrency: params.sourceCurrency,
  })
}
