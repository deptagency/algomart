import { CollectiblesShowcase } from '@algomart/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getShowcaseByUserQueryKey } from './use-showcase-by-user'

import { CollectibleService } from '@/services/collectible-service'

const mutation = (collectibleId: string) =>
  CollectibleService.instance.removeCollectibleShowcase(collectibleId)

export function useRemoveFromCollectibleShowcase(username: string) {
  const queryClient = useQueryClient()
  return useMutation(mutation, {
    onMutate: async (removedId) => {
      const key = getShowcaseByUserQueryKey(username)

      await queryClient.cancelQueries(key)

      const previousData = queryClient.getQueryData<CollectiblesShowcase>(key)

      const newData = {
        ...previousData,
        collectibles: previousData.collectibles.filter(
          ({ id }) => id !== removedId
        ),
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
