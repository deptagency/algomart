import { SortOptions } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { parse, stringify } from 'query-string'

import { useLanguage } from '@/contexts/language-context'
import {
  BrowseProductFilter,
  getPackSortOptions,
  getPublishedPacksQueryFromState,
  searchPublishedPacksQuery as searchPublishedPacksQuery,
} from '@/utils/filters'

export const PACKS_PER_PAGE = 9

export interface PackFilterState {
  currentPage: number
  pageSize: number
  priceHigh: number
  priceLow: number
  showAuction: boolean
  showPurchase: boolean
  showAuctionUpcoming: boolean
  showAuctionActive: boolean
  showAuctionExpired: boolean
  showAuctionReserveMet: boolean
  sortMode: SortOptions
  tags: string[]
}

const defaults = {
  currentPage: 1,
  pageSize: PACKS_PER_PAGE,
  priceHigh: 50_000,
  priceLow: 0,
  showAuction: true,
  showPurchase: true,
  showAuctionUpcoming: true,
  showAuctionActive: true,
  showAuctionExpired: true,
  showAuctionReserveMet: true,
  sortMode: SortOptions.Newest,
  tags: [],
}

const getStateFromQueryString = (queryString: string): PackFilterState => ({
  ...defaults,
  ...parse(queryString, {
    parseBooleans: true,
    parseNumbers: true,
    arrayFormat: 'bracket',
  }),
})

/**
 * Reads and writes the pack filter state from the URL query string.
 * Drops and Marketplace use the apiQueryString generated here to
 * fetch data.
 */
export function usePackFilter(): BrowseProductFilter<PackFilterState> {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const selectOptions = getPackSortOptions(t)
  const { pathname, push, query } = useRouter()
  const queryString = stringify(query)
  const state = getStateFromQueryString(queryString)

  const updateState = (values: Partial<PackFilterState>) => {
    const newState = { ...state, ...values }
    const newQueryString = stringify(newState, { arrayFormat: 'bracket' })
    if (queryString !== newQueryString) {
      push({ pathname, query: newQueryString }, undefined, { scroll: false })
    }
  }

  const getUpdateHandler =
    (field: keyof PackFilterState) => (value: unknown) => {
      updateState({ [field]: value })
    }

  const apiQueryString = searchPublishedPacksQuery(
    getPublishedPacksQueryFromState(language, state)
  )

  return {
    ...state,
    updateState,
    apiQueryString,
    selectOptions,
    getUpdateHandler,
  }
}
