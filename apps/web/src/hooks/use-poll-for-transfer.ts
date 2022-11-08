import { CircleTransferStatus } from '@algomart/schemas'
import { useEffect, useState } from 'react'

import { useInterval } from './use-interval'

import { useAuth } from '@/contexts/auth-context'
import { CheckoutService } from '@/services/checkout-service'

export default function usePollForTransfer({
  payment,
  onComplete,
  onFailure,
  onPending = null,
}) {
  const [status, setStatus] = useState<CircleTransferStatus>(null)
  const auth = useAuth()

  useInterval(
    async () => {
      try {
        const transfer =
          await CheckoutService.instance.getUserAccountTransferByPaymentId(
            payment.id
          )
        if (transfer) {
          setStatus(transfer.status)
        }
      } catch (error) {
        // if there's a 409 (conflict) then that means that the payment is failed
        // so we'll never expect to see a transfer show up
        if (error.response.status === 409) {
          onFailure()
        }
        // otherwise, swallow the error and keep polling
      }
    },
    [CircleTransferStatus.Pending, null].includes(status) ? 1000 : null
  )

  useEffect(() => {
    if (status === CircleTransferStatus.Pending) {
      onPending && onPending()
    }
    if (status === CircleTransferStatus.Failed) {
      onFailure()
    }
    if (status === CircleTransferStatus.Complete) {
      // reload profile to get new balance before sending them along.
      auth.reloadProfile().then(() => onComplete())
    }
  }, [auth, status !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  return {}
}
