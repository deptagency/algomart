import { PublishedPacks } from '@algomart/schemas'

import { useAPI } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export const usePublishedPacksQueryName = 'publishedPacks'

export function usePublishedPacks(queryString: string) {
  return useAPI<PublishedPacks>(
    [usePublishedPacksQueryName, queryString],
    queryString ? `${urls.api.packs.search}?${queryString}` : undefined
  )
}
