import useTranslation from 'next-translate/useTranslation'
import { useMemo } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import { Email, Password, Submit } from '@/components/auth-inputs/auth-inputs'
import { Form } from '@/components/form'
import { H1 } from '@/components/heading'
import { validateLogin } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export interface LoginEmailTemplateProps {
  handleLogin(data: { email: string; password: string }): Promise<void>
  loading: boolean
  authError: string | null
}

export default function LoginEmailTemplate({
  handleLogin,
  loading,
  authError,
}: LoginEmailTemplateProps) {
  const { t } = useTranslation()
  const validate = useMemo(() => validateLogin(t), [t])

  return (
    <div className="mx-auto w-[340px] mb-8">
      <H1 uppercase mb={6}>
        {t('common:actions.Sign In')}
      </H1>
      <Form onSubmit={handleLogin} validate={validate}>
        {({ errors }) => (
          <>
            {authError && (
              <AlertMessage
                className="mb-6"
                content={t('forms:errors.invalidCredentials')}
                variant="red"
              />
            )}

            <Email error={errors.email} variant="light" />
            <Password variant="light" error={errors.password} />

            <Submit busy={loading} size="large" />

            <AppLink href={urls.sendResetPassword} className="block mt-6">
              {t('auth:Forgot your password?')}
            </AppLink>
            <p className="pt-6 mt-8 border-t border-action-primary">
              <AppLink href={urls.signUp}>
                <u>{t('auth:Need an account? Create one now')}</u>
              </AppLink>
            </p>
          </>
        )}
      </Form>
    </div>
  )
}
