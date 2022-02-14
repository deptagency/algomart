import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import EmailVerification from '@/components/profile/email-verification'
import Success from '@/components/purchase-form/shared/success'
import { useAuth } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export default function CheckoutSuccessTemplate() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { push } = useRouter()

  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <Success
      buttonText={t('common:actions.View My Collection')}
      handleClick={() => push(urls.myCollection)}
      headingClassName="mb-16"
      headingText={t('common:statuses.Success!')}
    />
  )
}
