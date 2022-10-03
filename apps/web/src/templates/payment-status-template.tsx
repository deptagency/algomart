import DepositPending from '@/components/payment-form/deposit-pending'
import Failure from '@/components/payment-form/transfer-failure'
import Success from '@/components/payment-form/transfer-success'
import EmailVerificationPrompt from '@/components/profile/email-verification-prompt'
import { useAuth } from '@/contexts/auth-context'
import { Status, StatusPageProps } from '@/pages/payments/[status]'

export default function PaymentStatusTemplate({
  payment,
  status,
}: StatusPageProps) {
  const { user } = useAuth()

  if (!user?.emailVerified) {
    return <EmailVerificationPrompt inline />
  }
  return (
    <>
      {[Status.pending_transfer, Status.pending].includes(status) && (
        <DepositPending payment={payment} status={status} />
      )}
      {status === Status.success && <Success />}
      {status === Status.failure && <Failure payment={payment} />}
    </>
  )
}
