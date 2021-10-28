import {
  CollectibleListQuerystring,
  PacksByOwnerQuery,
  PackStatus,
  PackType,
  PublishedPacksQuery,
  SortOptions,
} from '@algomart/schemas'
import { Translate } from 'next-translate'
import { stringify } from 'query-string'

import { PAGE_SIZE } from '@/components/pagination/pagination'
import { PackFilterState } from '@/hooks/usePackFilter'

/**
 * Build a search parameter string to filter published packs
 */

export const getPublishedPacksFilterQuery = (query: PublishedPacksQuery) => {
  return stringify({
    locale: query.locale,
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
    locale: query.locale,
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
  locale: string,
  state: PackFilterState
): PublishedPacksQuery => {
  const status: PackStatus[] = []
  if (state.showAuctionExpired) status.push(PackStatus.Expired)
  if (state.showAuctionActive) status.push(PackStatus.Active)
  if (state.showAuctionUpcoming) status.push(PackStatus.Upcoming)

  const type: PackType[] = []
  if (state.showAuction) type.push(PackType.Auction)
  if (state.showPurchase) type.push(PackType.Purchase)
  if (type.length === 0) type.push(PackType.Auction, PackType.Purchase)

  return {
    locale,
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
    locale: query.locale,
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
 * Build selection options for sorting
 */
export const getSelectSortingOptions = (t: Translate) => {
  return [
    { id: SortOptions.Newest, label: t('collection:sorting.Newest') },
    { id: SortOptions.Oldest, label: t('collection:sorting.Oldest') },
    { id: SortOptions.Name, label: t('collection:sorting.Name') },
  ]
}
