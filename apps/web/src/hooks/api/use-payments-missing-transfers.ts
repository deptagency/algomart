import { GetPaymentsMissingTransfersResponse } from '@algomart/schemas'

import { useAPI } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export const usePaymentsMissingTransfersQueryName = 'paymentsMissingTransfers'

export function usePaymentsMissingTransfers() {
  return useAPI<GetPaymentsMissingTransfersResponse>(
    [usePaymentsMissingTransfersQueryName],
    urls.api.payments.missingTransfers
  )
}
