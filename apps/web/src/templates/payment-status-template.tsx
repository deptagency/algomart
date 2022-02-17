import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import EmailVerification from '@/components/profile/email-verification'
import Failure from '@/components/purchase-form/shared/failure'
import Success from '@/components/purchase-form/shared/success'
import { useAuth } from '@/contexts/auth-context'
import { Status, StatusPageProps } from '@/pages/payments/[status]'
import { urls } from '@/utils/urls'

export default function PaymentStatusTemplate({
  payment,
  status,
}: StatusPageProps) {
  console.log('PaymentStatusTemplate payment', payment)
  const { t } = useTranslation()
  const { user } = useAuth()
  const { push } = useRouter()

  const handleRetry = useCallback(() => {
    push(urls.releases)
  }, [push])

  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <>
      {status === Status.success && (
        <Success
          buttonText={t('common:actions.View My Collection')}
          handleClick={() => push(urls.myCollection)}
          headingClassName="mb-16"
          headingText={t('common:statuses.Success!')}
        />
      )}
      {status === Status.failure && (
        <Failure
          buttonText={t('common:actions.Try Again')}
          error={t('forms:errors.failedPayment')}
          handleClick={handleRetry}
          headingText={t('release:failedToClaim')}
        />
      )}
    </>
  )
}
