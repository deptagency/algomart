import {
  CollectibleListingsQuery,
  CollectibleListingsSortField,
  CollectibleListingStatus,
  CollectiblesQuery,
  CollectibleTemplateUniqueCodeQuery,
  GetCurrencyConversions,
  PacksByOwnerQuery,
  PackSortField,
  PackStatus,
  PackType,
  PublishedPacksQuery,
  SortDirection,
  SortOptions,
  UserAccountTransfersQuery,
} from '@algomart/schemas'
import { Translate } from 'next-translate'
import { stringify } from 'query-string'

import { PAGE_SIZE } from '@/components/pagination/pagination'
import { SelectOption } from '@/components/select'
import {
  CollectibleListingsFilterState,
  COLLECTIBLES_PER_PAGE,
} from '@/hooks/use-collectible-listings-filter'
import { PackFilterState, PACKS_PER_PAGE } from '@/hooks/use-pack-filter'

export type BrowseProductFilter<T> = T & {
  updateState: (values: Partial<T>) => void
  apiQueryString: string
  selectOptions: SelectOption[]
  getUpdateHandler: (field: keyof T) => (value: unknown) => void
}

/**
 * Build a search parameter string to filter published packs
 */
export const searchPublishedPacksQuery = (query: PublishedPacksQuery) => {
  return stringify({
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PACKS_PER_PAGE,
    priceHigh: query.priceHigh,
    priceLow: query.priceLow,
    reserveMet: query.reserveMet,
    slug: query.slug,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    templateIds: query.templateIds,
    status: query.status,
    type: query.type,
    tags: query.tags,
  })
}

/**
 * Build a search paramter string to filter listed nfts
 */
export const searchCollectiblesQuery = (query: CollectiblesQuery) => {
  return stringify({
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    priceHigh: query.priceHigh,
    priceLow: query.priceLow,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    templateIds: query.templateIds,
  })
}

/**
 * Build a search paramter string to filter listed nfts
 */
export const searchCollectibleListingsQuery = (
  query: CollectibleListingsQuery
) => {
  return stringify({
    language: query.language,
    listingStatus: query.listingStatus,
    page: query.page,
    pageSize: query.pageSize || COLLECTIBLES_PER_PAGE,
    priceHigh: query.priceHigh,
    priceLow: query.priceLow,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    tags: query.tags,
  })
}

/**
 * Build a search parameter string to filter user account transfers
 */
export const searchUserAccountTransfersQuery = (
  query:
    | UserAccountTransfersQuery
    | Omit<UserAccountTransfersQuery, 'userExternalId'>
) => {
  return stringify({
    joinCollectible: query.joinCollectible,
    joinListing: query.joinListing,
    joinPack: query.joinPack,
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    status: query.status,
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
 * Formats a PublishedPacksQuery object from state of usePackFilter
 */
export const getPublishedPacksQueryFromState = (
  language: string,
  state: PackFilterState
): PublishedPacksQuery => {
  const status: PackStatus[] = []
  if (state.showAuctionExpired) status.push(PackStatus.Expired)
  if (state.showAuctionActive) status.push(PackStatus.Active)
  if (state.showAuctionUpcoming) status.push(PackStatus.Upcoming)

  const type: PackType[] = [PackType.Free, PackType.Redeem]
  if (state.showAuction) type.push(PackType.Auction)
  if (state.showPurchase) type.push(PackType.Purchase)

  const sortDirection =
    state.sortMode === SortOptions.Oldest
      ? SortDirection.Ascending
      : SortDirection.Descending

  return {
    language,
    page: state.currentPage,
    pageSize: state.pageSize,
    priceHigh: state.priceHigh,
    priceLow: state.priceLow,
    reserveMet: state.showAuctionReserveMet,
    sortBy: PackSortField.ReleasedAt,
    sortDirection,
    status,
    tags: state.tags,
    type,
  }
}

/**
 * Formats a CollectiblesQuery object from state of useCollectibleFilter
 */
export const getCollectiblesListingQueryFromState = (
  language: string,
  state: CollectibleListingsFilterState
): CollectibleListingsQuery => {
  const sortDirection =
    state.sortMode === SortOptions.Oldest
      ? SortDirection.Ascending
      : SortDirection.Descending

  return {
    language,
    page: state.currentPage,
    pageSize: state.pageSize,
    priceHigh: state.priceHigh,
    priceLow: state.priceLow,
    sortBy: CollectibleListingsSortField.CreatedAt,
    listingStatus: [CollectibleListingStatus.Active],
    sortDirection,
    tags: state.tags,
  }
}

/**
 * Build a search parameter string to filter collectibles
 */
export const getCollectiblesFilterQuery = (query: CollectiblesQuery) => {
  const queryMap: CollectiblesQuery = {
    joinCurrentOwner: query.joinCurrentOwner,
    joinListings: query.joinListings,
    joinTemplates: query.joinTemplates,
    language: query.language,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
    username: query.username,
    userExternalId: query.userExternalId,
    templateIds: query.templateIds,
    setIds: query.setIds,
    collectionIds: query.collectionIds,
  }

  return stringify(queryMap)
}

/**
 * Build a search parameter string to filter collectible listings
 */
export const getCollectibleListingsFilterQuery = (
  query: CollectibleListingsQuery
) => {
  return stringify({
    language: query.language,
    listingStatus: query.listingStatus,
    listingType: query.listingType,
    page: query.page,
    pageSize: query.pageSize || PAGE_SIZE,
    priceHigh: query.priceHigh,
    priceLow: query.priceLow,
    tags: query.tags,
    sortBy: query.sortBy,
    sortDirection: query.sortDirection,
  })
}

/**
 * Build a search parameter string to get collectible template by unique code
 */
export const getCollectibleTemplateByUniqueCodeQuery = (
  query: CollectibleTemplateUniqueCodeQuery
) => {
  return stringify({
    language: query.language,
  })
}

/**
 * Build a search parameter string to filter payments
 */

export const getCurrencyConversionsQuery = (params: GetCurrencyConversions) => {
  return stringify({
    sourceCurrency: params.sourceCurrency,
  })
}

/**
 * Build selection options for sorting
 */
export function getSortOptions(t: Translate): SelectOption[] {
  return [
    { value: SortOptions.Newest, label: t('collection:sorting.Newest') },
    { value: SortOptions.Oldest, label: t('collection:sorting.Oldest') },
    {
      value: SortOptions.RarityAscending,
      label: t('collection:sorting.RarityAscending'),
    },
    {
      value: SortOptions.RarityDescending,
      label: t('collection:sorting.RarityDescending'),
    },
  ]
}

export function getPackSortOptions(t: Translate): SelectOption[] {
  return [
    { value: SortOptions.Newest, label: t('drops:packs.sorting.Newest') },
    { value: SortOptions.Oldest, label: t('drops:packs.sorting.Oldest') },
  ]
}

export function getCollectibleSortOptions(t: Translate): SelectOption[] {
  return [
    {
      value: SortOptions.Newest,
      label: t('drops:collectibles.sorting.Newest'),
    },
    {
      value: SortOptions.Oldest,
      label: t('drops:collectibles.sorting.Oldest'),
    },
  ]
}
