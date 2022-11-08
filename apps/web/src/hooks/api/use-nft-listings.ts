import {
  CollectibleListingsQuery,
  CollectibleListingsResponse,
} from '@algomart/schemas'

import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export const useNFTListingsQueryKey = 'nft_listings'

export function useNFTListings(query: CollectibleListingsQuery = {}) {
  return useAPI<CollectibleListingsResponse>(
    [useNFTListingsQueryKey, query],
    urlFor(urls.api.marketplace.listingsSearch, null, query)
  )
}
