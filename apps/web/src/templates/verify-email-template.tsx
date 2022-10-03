import { CheckCircleIcon } from '@heroicons/react/outline'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import React, { useCallback, useState } from 'react'

import css from './verify-email-template.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import Button from '@/components/button'
import { H1, H2 } from '@/components/heading'
import LinkButton from '@/components/link-button'
import { useAuth } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export interface VerifyEmailTemplateProps {
  validVerification: boolean
}

export default function VerifyEmailTemplate({
  validVerification,
}: VerifyEmailTemplateProps) {
  const { sendNewEmailVerification, isAuthenticated } = useAuth()
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

  return (
    <>
      <H1 uppercase center mb={8}>
        {t('auth:Verify Email')}
      </H1>

      {validVerification ? (
        <div className={css.successRoot}>
          <div className={css.success}>
            <CheckCircleIcon className={css.icon} />

            <H2 mb={6}>{t('common:statuses.Success!')}</H2>

            {isAuthenticated ? (
              <LinkButton href={urls.home}>
                {t('common:actions.Back To Home')}
              </LinkButton>
            ) : (
              <LinkButton href={urls.loginEmail}>
                {t('common:actions.Sign In')}
              </LinkButton>
            )}
          </div>
        </div>
      ) : (
        <AlertMessage
          className="mb-6"
          content={
            <Trans
              components={[
                <Button
                  key={0}
                  disabled={sent}
                  variant="link"
                  onClick={handleResend}
                ></Button>,
              ]}
              i18nKey="auth:verifyEmailInvalid"
            />
          }
          variant="red"
        />
      )}
    </>
  )
}
