import {
  CollectibleListQuerystring,
  PacksByOwnerQuery,
  PackStatus,
  PackType,
  PaymentsQuerystring,
  PublishedPacksQuery,
  SortOptions,
  UsersQuerystring,
} from '@algomart/schemas'
import { Translate } from 'next-translate'
import { stringify } from 'query-string'

import { PAGE_SIZE } from '@/components/pagination/pagination'
import { SelectOption } from '@/components/select-input/select-input'
import { PackFilterState } from '@/hooks/use-pack-filter'

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
 * Formats a PublishedPacksQuery object from state of useFilterReducer
 */
export const getPublishedPacksFilterQueryFromState = (
  language: string,
  state: PackFilterState,
  currency: string
): PublishedPacksQuery => {
  const status: PackStatus[] = []
  if (state.showAuctionExpired) status.push(PackStatus.Expired)
  if (state.showAuctionActive) status.push(PackStatus.Active)
  if (state.showAuctionUpcoming) status.push(PackStatus.Upcoming)

  const type: PackType[] = []
  if (state.showAuction) type.push(PackType.Auction)
  if (state.showPurchase) type.push(PackType.Purchase)

  return {
    language,
    currency,
    page: state.currentPage,
    priceHigh: state.priceHigh,
    priceLow: state.priceLow,
    reserveMet: state.showAuctionReserveMet,
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
    { key: SortOptions.Newest, label: t('collection:sorting.Newest') },
    { key: SortOptions.Oldest, label: t('collection:sorting.Oldest') },
    // { key: SortOptions.Name, label: t('collection:sorting.Name') },
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
