import { PacksByOwner } from '@algomart/schemas'

import { useAuth } from '@/contexts/auth-context'
import { useAuthApi } from '@/utils/swr'
import { urls } from '@/utils/urls'

export function useUntransferredPacks() {
  const auth = useAuth()
  return useAuthApi<PacksByOwner>(
    auth.user ? urls.api.v1.getUntransferredPacks : null,
    { refreshInterval: 60_000 }
  )
}
