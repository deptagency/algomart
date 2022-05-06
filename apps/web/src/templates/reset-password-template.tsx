import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import { Email, Submit } from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import { AuthState } from '@/types/auth'
import { urls } from '@/utils/urls'

export interface ResetPasswordTemplateProps {
  formErrors:
    | Partial<{
        email?: unknown
      }>
    | undefined
  handleResetPassword(event: FormEvent<HTMLFormElement>): Promise<void>
  resetSent: boolean
  status: AuthState['status']
}

export default function ResetPasswordTemplate({
  formErrors,
  handleResetPassword,
  resetSent,
  status,
}: ResetPasswordTemplateProps) {
  const { t } = useTranslation()
  return (
    <>
      <Heading className="mb-8 text-center">{t('auth:Reset Password')}</Heading>

      <form
        className="relative max-w-sm mx-auto"
        onSubmit={handleResetPassword}
      >
        {resetSent && (
          <AlertMessage
            className="mb-6"
            content={
              <Trans
                components={[
                  <p className="mb-4" key={0} />,
                  <p key={1} />,
                  <AppLink key={2} href={urls.loginEmail} />,
                ]}
                i18nKey="auth:resetPasswordBody"
              />
            }
            variant="green"
          />
        )}
        <Email error={formErrors?.email} />
        <Submit disabled={status === 'loading'} />

        <p className="mt-4 text-center">
          <AppLink href={urls.signUp}>
            <u>{t('auth:Need an account? Create one now')}</u>
          </AppLink>
        </p>
      </form>
    </>
  )
}
