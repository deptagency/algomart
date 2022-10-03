import { CollectiblesQuery, CollectiblesResponse } from '@algomart/schemas'

import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export const useNFTsQueryName = 'nfts'

export function useNFTs(query: CollectiblesQuery) {
  return useAPI<CollectiblesResponse>(
    [useNFTsQueryName, query],
    urlFor(urls.api.collectibles.search, null, query)
  )
}
