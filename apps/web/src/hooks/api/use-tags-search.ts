import { TagBase } from '@algomart/schemas'

import { useLanguage } from '@/contexts/language-context'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export function useTagsSearch(query?: string) {
  const { language } = useLanguage()
  return useAPI<TagBase[]>(
    ['tagsSearch', query],
    query?.length > 1
      ? urlFor(urls.api.tags.search, { query }, { language })
      : undefined
  )
}
