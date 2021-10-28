import { PackSortField, SortDirection, SortOptions } from '@algomart/schemas'
import useTranslation from 'next-translate/useTranslation'
import { Dispatch, useMemo, useReducer } from 'react'

import { SelectOption } from '@/components/select/select'
import { getSelectSortingOptions } from '@/utils/filters'
import {
  ActionsUnion,
  ActionsWithPayload,
  createActionPayload,
} from '@/utils/reducer'

/**
 * Pack filter reducer
 */
export interface PackFilterState {
  currentPage: number
  priceHigh: number
  priceLow: number
  selectedOption: SelectOption
  selectOptions: SelectOption[]
  showAuction: boolean
  showPurchase: boolean
  showAuctionUpcoming: boolean
  showAuctionActive: boolean
  showAuctionExpired: boolean
  showAuctionReserveMet: boolean
  sortBy: PackSortField
  sortDirection: SortDirection
}

const SET_CURRENT_PAGE = 'SET_CURRENT_PAGE'
const SET_PRICE = 'SET_PRICE'
const SET_SHOW_AUCTION = 'SET_SHOW_AUCTION'
const SET_SHOW_PURCHASE = 'SET_SHOW_PURCHASE'
const SET_SHOW_AUCTION_UPCOMING = 'SET_SHOW_AUCTION_UPCOMING'
const SET_SHOW_AUCTION_ACTIVE = 'SET_SHOW_AUCTION_ACTIVE'
const SET_SHOW_AUCTION_EXPIRED = 'SET_SHOW_AUCTION_EXPIRED'
const SET_SHOW_AUCTION_RESERVE_MET = 'SET_SHOW_AUCTION_RESERVE_MET'
const SET_SORT = 'SET_SORT'

export const packFilterActions = {
  setCurrentPage: createActionPayload<typeof SET_CURRENT_PAGE, number>(
    SET_CURRENT_PAGE
  ),
  setPrice: createActionPayload<
    typeof SET_PRICE,
    { priceLow: number; priceHigh: number }
  >(SET_PRICE),
  setShowAuction: createActionPayload<typeof SET_SHOW_AUCTION, boolean>(
    SET_SHOW_AUCTION
  ),
  setShowPurchase: createActionPayload<typeof SET_SHOW_PURCHASE, boolean>(
    SET_SHOW_PURCHASE
  ),
  setShowAuctionUpcoming: createActionPayload<
    typeof SET_SHOW_AUCTION_UPCOMING,
    boolean
  >(SET_SHOW_AUCTION_UPCOMING),
  setShowAuctionActive: createActionPayload<
    typeof SET_SHOW_AUCTION_ACTIVE,
    boolean
  >(SET_SHOW_AUCTION_ACTIVE),
  setShowAuctionExpired: createActionPayload<
    typeof SET_SHOW_AUCTION_EXPIRED,
    boolean
  >(SET_SHOW_AUCTION_EXPIRED),
  setShowAuctionReserveMet: createActionPayload<
    typeof SET_SHOW_AUCTION_RESERVE_MET,
    boolean
  >(SET_SHOW_AUCTION_RESERVE_MET),
  setSort: createActionPayload<typeof SET_SORT, SelectOption>(SET_SORT),
}

export type PackFilterActions = Dispatch<
  | ActionsWithPayload<typeof SET_CURRENT_PAGE, number>
  | ActionsWithPayload<
      typeof SET_PRICE,
      { priceLow: number; priceHigh: number }
    >
  | ActionsWithPayload<typeof SET_SHOW_AUCTION, boolean>
  | ActionsWithPayload<typeof SET_SHOW_PURCHASE, boolean>
  | ActionsWithPayload<typeof SET_SHOW_AUCTION_UPCOMING, boolean>
  | ActionsWithPayload<typeof SET_SHOW_AUCTION_ACTIVE, boolean>
  | ActionsWithPayload<typeof SET_SHOW_AUCTION_EXPIRED, boolean>
  | ActionsWithPayload<typeof SET_SHOW_AUCTION_RESERVE_MET, boolean>
  | ActionsWithPayload<typeof SET_SORT, SelectOption>
>

export interface PackFilter {
  dispatch: PackFilterActions
  state: PackFilterState
}

export function packFilterReducer(
  state: PackFilterState,
  action: ActionsUnion<typeof packFilterActions>
): PackFilterState {
  switch (action.type) {
    case SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload }
    case SET_PRICE:
      return {
        ...state,
        currentPage: 1,
        priceLow: action.payload.priceLow,
        priceHigh: action.payload.priceHigh,
      }
    case SET_SHOW_AUCTION:
      return { ...state, currentPage: 1, showAuction: action.payload }
    case SET_SHOW_PURCHASE:
      return { ...state, currentPage: 1, showPurchase: action.payload }
    case SET_SHOW_AUCTION_UPCOMING:
      return { ...state, currentPage: 1, showAuctionUpcoming: action.payload }
    case SET_SHOW_AUCTION_ACTIVE:
      return { ...state, currentPage: 1, showAuctionActive: action.payload }
    case SET_SHOW_AUCTION_EXPIRED:
      return { ...state, currentPage: 1, showAuctionExpired: action.payload }
    case SET_SHOW_AUCTION_RESERVE_MET:
      return { ...state, currentPage: 1, showAuctionReserveMet: action.payload }
    case SET_SORT: {
      let sortBy = PackSortField.Title
      let sortDirection = SortDirection.Ascending
      switch (action.payload.id) {
        case SortOptions.Newest:
          sortBy = PackSortField.ReleasedAt
          sortDirection = SortDirection.Descending
          break
        case SortOptions.Oldest:
          sortBy = PackSortField.ReleasedAt
          sortDirection = SortDirection.Ascending
          break
        case SortOptions.Name:
          sortBy = PackSortField.Title
          sortDirection = SortDirection.Ascending
          break
      }
      return {
        ...state,
        currentPage: 1,
        selectedOption: action.payload,
        sortBy,
        sortDirection,
      }
    }
    default:
      return state
  }
}

// usePackFilter hook
export function usePackFilter() {
  const { t } = useTranslation()
  const selectOptions = getSelectSortingOptions(t)
  const [state, dispatch] = useReducer(packFilterReducer, {
    currentPage: 1,
    priceHigh: 50_000,
    priceLow: 0,
    selectedOption: selectOptions[0],
    selectOptions,
    showAuction: true,
    showPurchase: true,
    showAuctionUpcoming: true,
    showAuctionActive: true,
    showAuctionExpired: true,
    showAuctionReserveMet: false,
    sortBy: PackSortField.ReleasedAt,
    sortDirection: SortDirection.Descending,
  })

  const value = useMemo(
    () => ({
      dispatch,
      state,
    }),
    [dispatch, state]
  )
  return value
}
