import { PublicConfig } from '@/environment'
import { useApi } from '@/utils/swr'

export function useConfig(): Partial<PublicConfig> {
  const { data } = useApi<PublicConfig>('/api/v1/config', {
    revalidateOnFocus: false,
  })
  return data || {}
}
