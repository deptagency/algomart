import { CheckCircleIcon } from '@heroicons/react/outline'
import useTranslation from 'next-translate/useTranslation'

import css from './checkout-status-template.module.css'

import Heading from '@/components/heading'
import EmailVerification from '@/components/profile/email-verification'
import { useAuth } from '@/contexts/auth-context'

export default function CheckoutFailureTemplate() {
  const { t } = useTranslation()
  const { user } = useAuth()

  if (!user?.emailVerified) {
    return <EmailVerification inline />
  }
  return (
    <>
      <CheckCircleIcon className={css.icon} height="48" width="48" />
      <Heading className="mb-10" level={1}>
        {t('common:statuses.Success!')}
      </Heading>
    </>
  )
}
