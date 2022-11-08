import { CollectibleActivity } from '@algomart/schemas'

import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export const useNftActivitiesQueryName = 'nftActivities'

export function useNFTActivities(assetId?: number | bigint | string) {
  return useAPI<CollectibleActivity[]>(
    [useNftActivitiesQueryName, assetId],
    assetId
      ? urlFor(urls.api.collectibles.activities, null, { assetId })
      : undefined
  )
}
