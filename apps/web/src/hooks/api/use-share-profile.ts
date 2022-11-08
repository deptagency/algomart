import { CollectiblesShowcase } from '@algomart/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getShowcaseByUserQueryKey } from './use-showcase-by-user'

import { CollectibleService } from '@/services/collectible-service'

const mutation = (showProfile: boolean) =>
  CollectibleService.instance.shareProfile(showProfile)

export function useShareProfile(username: string) {
  const queryClient = useQueryClient()
  return useMutation(mutation, {
    onMutate: async (isNowShared) => {
      const key = getShowcaseByUserQueryKey(username)

      await queryClient.cancelQueries(key)

      const previousData = queryClient.getQueryData<CollectiblesShowcase>(key)

      const newData: CollectiblesShowcase = {
        ...previousData,
        showProfile: isNowShared,
      }
      queryClient.setQueryData(key, newData)

      return { previousData }
    },
    onSettled: () => {
      queryClient.invalidateQueries(getShowcaseByUserQueryKey(username))
    },
    onError: (_error, _addedId, context) => {
      queryClient.setQueryData(
        getShowcaseByUserQueryKey(username),
        context.previousData
      )
    },
  })
}
