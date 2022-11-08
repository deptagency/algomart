import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import { Email, Submit } from '@/components/auth-inputs/auth-inputs'
import { H1 } from '@/components/heading'
import { AuthState } from '@/contexts/auth-context'
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

export default function SendResetPasswordTemplate({
  formErrors,
  handleResetPassword,
  resetSent,
  status,
}: ResetPasswordTemplateProps) {
  const { t } = useTranslation()
  return (
    <>
      <H1 center uppercase mb={6}>
        {t('auth:Reset Password')}
      </H1>

      <form
        className="relative w-full max-w-sm mx-auto"
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
        <Submit
          disabled={status === 'loading' || resetSent}
          translationKey="common:actions.Send Reset Link"
          size="large"
        />

        <p className="mt-4 text-center">
          <AppLink href={urls.signUp} underline>
            {t('auth:Need an account?')}
          </AppLink>
        </p>
      </form>
    </>
  )
}
