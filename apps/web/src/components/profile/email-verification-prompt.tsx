import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './email-verification-prompt.module.css'

import Banner from '@/components/banner/banner'
import Button from '@/components/button'
import { useAuth } from '@/contexts/auth-context'

interface EmailVerificationPromptProps {
  inline?: boolean
}

export default function EmailVerificationPrompt({
  inline,
}: EmailVerificationPromptProps) {
  const { user, sendNewEmailVerification } = useAuth()
  const [sent, setSent] = useState<boolean>(false)
  const { t } = useTranslation()

  const handleResend = useCallback(async () => {
    try {
      await sendNewEmailVerification()
    } catch {
      // Fail silently if use requests too many resets at once
    } finally {
      setSent(true)
    }
  }, [sendNewEmailVerification])

  const refresh = useCallback(() => {
    window.location.reload()
  }, [])

  if (!user || user.emailVerified) return null

  return (
    <Banner
      inline={inline}
      className={clsx(css.wrapper, { [css.isInline]: inline })}
    >
      <p data-e2e="email-not-verified-prompt">
        {t('auth:Email address not verified')}
      </p>
      <p className={css.emailVerificationControls}>
        <Button disabled={sent} onClick={handleResend}>
          {t('auth:Resend')}
        </Button>
        <Button data-e2e="refresh-email-verification" onClick={refresh}>
          {t('auth:Refresh')}
        </Button>
      </p>
    </Banner>
  )
}
