import { CollectiblesResponse, CollectiblesShowcase } from '@algomart/schemas'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useNFTsQueryName } from './use-nfts'
import { getShowcaseByUserQueryKey } from './use-showcase-by-user'

import { CollectibleService } from '@/services/collectible-service'

const mutation = (collectibleId: string) =>
  CollectibleService.instance.addCollectibleShowcase(collectibleId)

export function useAddToShowcase(username: string) {
  const queryClient = useQueryClient()
  return useMutation(mutation, {
    onMutate: async (addedId) => {
      const key = getShowcaseByUserQueryKey(username)

      await queryClient.cancelQueries(key)

      const collectiblesData = queryClient.getQueryData<CollectiblesResponse>([
        useNFTsQueryName,
      ])

      const previousData = queryClient.getQueryData<CollectiblesShowcase>(key)

      const collectible = collectiblesData?.collectibles.find(
        ({ id }) => id === addedId
      )
      if (collectible) {
        const newData = {
          ...previousData,
          collectibles: [...previousData.collectibles, collectible],
        }
        queryClient.setQueryData(key, newData)
      }

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
