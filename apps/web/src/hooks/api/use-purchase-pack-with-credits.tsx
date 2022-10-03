import { UserAccountTransfer } from '@algomart/schemas'
import { FetcherError } from '@algomart/shared/utils'
import { useMutation } from '@tanstack/react-query'

import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

const mutation = (id: string) =>
  apiFetcher().post<UserAccountTransfer>(
    urls.api.payments.purchasePackWithCredits,
    {
      json: { packTemplateId: id },
    }
  )

export function usePurchasePackWithCredits() {
  return useMutation<UserAccountTransfer, FetcherError, string>(mutation)
}
