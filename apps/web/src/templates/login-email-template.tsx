import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AppLink from '@/components/app-link/app-link'
import { Email, Password, Submit } from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import Notification from '@/components/notification/notification'
import { AuthState } from '@/types/auth'
import { urls } from '@/utils/urls'

export interface LoginEmailTemplateProps {
  error: string | null
  formErrors:
    | Partial<{
        email?: unknown
        password?: unknown
      }>
    | undefined
  handleLogin(event: FormEvent<HTMLFormElement>): Promise<void>
  status: AuthState['status']
}

export default function LoginEmailTemplate({
  error,
  formErrors,
  handleLogin,
  status,
}: LoginEmailTemplateProps) {
  const { t } = useTranslation()
  return (
    <>
      <Heading className="mb-8 text-center">
        {t('auth:Sign into your account')}
      </Heading>
      <form className="relative max-w-sm mx-auto" onSubmit={handleLogin}>
        {status === 'error' && error && (
          <Notification
            className="mb-6"
            content={t('forms:errors.invalidCredentials')}
            variant="red"
          />
        )}
        <Email error={formErrors?.email} t={t} />
        <Password
          error={formErrors?.password}
          helpLink={
            <AppLink href={urls.resetPassword}>
              {t('auth:Forgot your password?')}
            </AppLink>
          }
          t={t}
        />
        <Submit disabled={status === 'loading'} t={t} />

        <p className="mt-4 text-center">
          <AppLink href={urls.signUp}>
            <u>{t('auth:Need an account? Create one now')}</u>
          </AppLink>
        </p>
      </form>
    </>
  )
}
