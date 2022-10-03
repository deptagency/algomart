import { CollectionWithSets } from '@algomart/schemas'

import { useLanguage } from '@/contexts/language-context'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export const useAllCollectionsQueryName = 'allCollections'

export function useAllCollections() {
  const { language } = useLanguage()
  return useAPI<{
    total: number
    collections: CollectionWithSets[]
  }>(
    [useAllCollectionsQueryName, language],
    urlFor(urls.api.collections.base, null, {
      language,
    })
  )
}
