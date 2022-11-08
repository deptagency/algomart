import { UserAccountTransfer } from '@algomart/schemas'
import { FetcherError } from '@algomart/shared/utils'
import { useMutation } from '@tanstack/react-query'

import { apiFetcher } from '@/utils/react-query'
import { urlFor, urls } from '@/utils/urls'

const mutation = (id: string) =>
  apiFetcher().post<UserAccountTransfer>(
    urlFor(urls.api.marketplace.purchaseListingWithCredits, { listingId: id })
  )

export function usePurchaseListingWithCredits() {
  return useMutation<UserAccountTransfer, FetcherError, string>(mutation)
}
