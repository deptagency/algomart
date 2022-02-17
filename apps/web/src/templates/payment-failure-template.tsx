import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import EmailVerification from '@/components/profile/email-verification'
import Failure from '@/components/purchase-form/shared/failure'
import { useAuth } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export default function PaymentFailureTemplate() {
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
    <Failure
      buttonText={t('common:actions.Try Again')}
      error={t('forms:errors.failedPayment')}
      handleClick={handleRetry}
      headingText={t('release:failedToClaim')}
    />
  )
}
