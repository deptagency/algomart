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
  const { t } = useTranslation()
  const { user } = useAuth()
  const { push } = useRouter()

  const handleRetry = useCallback(() => {
    push(urls.releases)
  }, [push])

  const handlePackOpening = useCallback((packId: string) => {
    const path = urls.packOpening.replace(':packId', packId)
    if (typeof window !== 'undefined') {
      window.location.assign(new URL(path, window.location.origin).href)
    }
  }, [])

  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <>
      {status === Status.success && (
        <Success
          buttonText={
            payment.packId
              ? t('common:actions.Open Pack')
              : t('common:actions.View My Collection')
          }
          handleClick={() => {
            if (payment.packId) {
              handlePackOpening(payment.packId)
            } else {
              push(urls.myCollection)
            }
          }}
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
