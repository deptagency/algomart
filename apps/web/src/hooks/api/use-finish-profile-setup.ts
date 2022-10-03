import { PublicAccount, UpdateUserAccount } from '@algomart/schemas'
import { FetcherError } from '@algomart/shared/utils'
import { useMutation } from '@tanstack/react-query'

import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

const mutation = (json: UpdateUserAccount) =>
  apiFetcher().patch<PublicAccount>(urls.api.accounts.base, { json })

export function useFinishProfileSetup() {
  return useMutation<PublicAccount, FetcherError, UpdateUserAccount>(mutation)
}
