import { CheckCircleIcon } from '@heroicons/react/outline'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import css from './reset-password-template.module.css'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import { Password, Submit } from '@/components/auth-inputs/auth-inputs'
import { H1, H2 } from '@/components/heading'
import { AuthState } from '@/contexts/auth-context'
import { urls } from '@/utils/urls'

export interface ResetPasswordTemplateProps {
  formErrors:
    | Partial<{
        password?: unknown
      }>
    | undefined
  handleResetPassword(event: FormEvent<HTMLFormElement>): Promise<void>
  status: AuthState['status']
  invalidReset: boolean
  resetComplete: boolean
}

export default function SendResetPasswordTemplate({
  formErrors,
  handleResetPassword,
  status,
  invalidReset,
  resetComplete,
}: ResetPasswordTemplateProps) {
  const { t } = useTranslation()

  if (resetComplete) {
    return (
      <div className={css.successRoot}>
        <div className={css.success}>
          <CheckCircleIcon className={css.icon} />

          <H2 mb={16}>{t('common:statuses.Success!')}</H2>

          <p>{t('common:statuses:Please wait while we log you in')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <H1 mb={8}>{t('auth:Reset Password')}</H1>

      {resetComplete ? (
        <div className={css.successRoot}>
          <div className={css.success}>
            <CheckCircleIcon className={css.icon} />

            <H2 mb={16}>{t('common:statuses.Success!')}</H2>

            <p>{t('common:statuses:Please wait while we log you in')}</p>
          </div>
        </div>
      ) : (
        <form
          className="relative w-full max-w-sm mx-auto"
          onSubmit={handleResetPassword}
        >
          {invalidReset && (
            <AlertMessage
              className="mb-6"
              content={
                <Trans
                  components={[
                    <p className="mb-4" key={0} />,
                    <p key={1} />,
                    <AppLink
                      key={2}
                      href={urls.sendResetPassword}
                      className="underline"
                    />,
                  ]}
                  i18nKey="auth:resetPasswordInvalid"
                />
              }
              variant="red"
            />
          )}
          <Password error={formErrors?.password} disabled={invalidReset} />
          <Submit
            disabled={status === 'loading' || invalidReset}
            translationKey="common:actions.Save"
          />
        </form>
      )}
    </>
  )
}
