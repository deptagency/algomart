import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import { Email, Password, Submit } from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
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
    <div className="bg-white p-16">
      <Heading className="mb-8 text-center uppercase">
        {t('common:actions.Sign In')}
      </Heading>
      <form className="relative max-w-sm mx-auto" onSubmit={handleLogin}>
        {status === 'error' && error && (
          <AlertMessage
            className="mb-6"
            content={t('forms:errors.invalidCredentials')}
            variant="red"
          />
        )}
        <Email error={formErrors?.email} t={t} />
        <Password error={formErrors?.password} t={t} />

        <Submit
          disabled={status === 'loading'}
          t={t}
          translationKey={'common:actions.Sign In'}
        />
        <AppLink
          href={urls.resetPassword}
          className="mt-4 block text-center text-secondary"
        >
          {t('auth:Forgot your password?')}
        </AppLink>
        <p className="mt-4 pt-4 text-center border-t-1 border-t-base-border">
          {t('auth:Need an account?')}{' '}
          <AppLink href={urls.signUp}>{t('common:actions.Sign Up')}</AppLink>
        </p>
      </form>
    </div>
  )
}
