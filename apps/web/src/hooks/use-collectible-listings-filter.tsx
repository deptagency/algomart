import { CollectibleListingStatus, SortOptions } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { parse, stringify } from 'query-string'

import { useLanguage } from '@/contexts/language-context'
import {
  BrowseProductFilter,
  getCollectiblesListingQueryFromState,
  getCollectibleSortOptions,
  searchCollectibleListingsQuery,
} from '@/utils/filters'

export const COLLECTIBLES_PER_PAGE = 9

export interface CollectibleListingsFilterState {
  currentPage: number
  pageSize: number
  listingStatus: CollectibleListingStatus[]
  priceHigh: number
  priceLow: number
  sortMode: SortOptions
  tags: string[]
}

const defaults = {
  currentPage: 1,
  pageSize: COLLECTIBLES_PER_PAGE,
  listingStatus: [CollectibleListingStatus.Active],
  priceHigh: 50_000,
  priceLow: 0,
  sortMode: SortOptions.Newest,
  tags: [],
}

const getStateFromQueryString = (
  queryString: string
): CollectibleListingsFilterState => ({
  ...defaults,
  ...parse(queryString, {
    parseBooleans: true,
    parseNumbers: true,
    arrayFormat: 'bracket',
  }),
})

export function useCollectibleListingsFilter(): BrowseProductFilter<CollectibleListingsFilterState> {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const selectOptions = getCollectibleSortOptions(t)
  const { pathname, push, query } = useRouter()
  const queryString = stringify(query)
  const state = getStateFromQueryString(queryString)

  const updateState = (values: Partial<CollectibleListingsFilterState>) => {
    const newState = { ...state, ...values }
    const newQueryString = stringify(newState)
    if (queryString !== newQueryString) {
      push({ pathname, query: newQueryString }, undefined, { scroll: false })
    }
  }

  const getUpdateHandler =
    (field: keyof CollectibleListingsFilterState) => (value: unknown) => {
      updateState({ [field]: value })
    }

  const apiQueryString = searchCollectibleListingsQuery(
    getCollectiblesListingQueryFromState(language, state)
  )

  return {
    ...state,
    updateState,
    apiQueryString,
    selectOptions,
    getUpdateHandler,
  }
}
