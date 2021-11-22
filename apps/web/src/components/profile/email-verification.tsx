import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import Banner from '../banner/banner'

import css from './email-verification.module.css'

import Button from '@/components/button'
import { useAuth } from '@/contexts/auth-context'

interface EmailVerificationProps {
  inline?: boolean
}

export default function EmailVerification({ inline }: EmailVerificationProps) {
  const auth = useAuth()
  const [sent, setSent] = useState<boolean>(false)
  const { t } = useTranslation()

  const handleResend = useCallback(async () => {
    try {
      await auth.sendNewEmailVerification()
    } catch {
      // Fail silently if use requests too many resets at once
    } finally {
      setSent(true)
    }
  }, [auth])

  const refresh = useCallback(() => {
    window.location.reload()
  }, [])

  if (!auth.user || auth.user.emailVerified) return null

  return (
    <Banner
      inline={inline}
      className={clsx(css.wrapper, { [css.isInline]: inline })}
    >
      <p>{t('auth:Email address not verified')}</p>
      <p className={css.emailVerificationControls}>
        <Button
          disabled={sent}
          onClick={handleResend}
          size="small"
          variant="primary"
        >
          {t('auth:Resend')}
        </Button>
        <Button size="small" variant="secondary" onClick={refresh}>
          {t('auth:Refresh')}
        </Button>
      </p>
    </Banner>
  )
}
