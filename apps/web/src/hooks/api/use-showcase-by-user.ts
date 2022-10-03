import { CollectiblesShowcase } from '@algomart/schemas'

import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export const useShowcaseByUserQueryName = 'showcaseByUser'
export const getShowcaseByUserQueryKey = (username: string) => [
  useShowcaseByUserQueryName,
  username,
]

export function useShowcaseByUser(username: string) {
  return useAPI<CollectiblesShowcase>(
    getShowcaseByUserQueryKey(username),
    urlFor(urls.api.collectibles.fetchShowcase, null, {
      ownerUsername: username,
    }),
    {
      enabled: !!username,
    }
  )
}
