import { Payment } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import Loading from '@/components/loading/loading'
import usePollForTransfer from '@/hooks/use-poll-for-transfer'
import { Status } from '@/pages/payments/[status]'
import { urls } from '@/utils/urls'

export interface DepositPendingProps {
  payment: Payment
  status: Status
}

export default function DepositPending({
  payment,
  status,
}: DepositPendingProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const onPending =
    status === Status.pending
      ? () => {
          router.push(`${urls.paymentTransferPending}?paymentId=${payment.id}`)
        }
      : null
  usePollForTransfer({
    payment,
    onComplete: () => {
      const destination = localStorage.getItem('redirectAfterCreditPurchase')
      if (destination) {
        localStorage.removeItem('redirectAfterCreditPurchase')
        window.location.pathname = destination
      } else {
        router.push(`${urls.paymentSuccess}?paymentId=${payment.id}`)
      }
    },
    onFailure: () => {
      router.push(`${urls.paymentFailure}?paymentId=${payment.id}`)
    },
    onPending,
  })

  const loadingText = {
    [Status.pending]: t('common:statuses.Processing payment'),
    [Status.pending_transfer]: t('common:statuses.Payment Transfer Pending'),
  }[status]

  return <Loading loadingText={loadingText} />
}
