import { TagBase } from '@algomart/schemas'

import { useLanguage } from '@/contexts/language-context'
import { useAPI } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

export function useTagsList(slugs?: string[]) {
  const { language } = useLanguage()
  return useAPI<TagBase[]>(
    ['tagsList', ...slugs],
    slugs?.length
      ? urlFor(urls.api.tags.list, {}, { language, slugs })
      : undefined
  )
}
