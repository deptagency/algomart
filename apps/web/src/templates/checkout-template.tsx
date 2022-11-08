import useTranslation from 'next-translate/useTranslation'
import { ReactNode } from 'react'

import MainPanelHeader from '@/components/main-panel-header'
import EmailVerificationPrompt from '@/components/profile/email-verification-prompt'
import { useAuth } from '@/contexts/auth-context'

export interface CheckoutTemplateProps {
  children: ReactNode
}

export default function CheckoutTemplate({ children }: CheckoutTemplateProps) {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <>
      <EmailVerificationPrompt inline />

      {user?.emailVerified && (
        <>
          <MainPanelHeader title={t('common:actions.Checkout')} />
          {children}
        </>
      )}
    </>
  )
}
