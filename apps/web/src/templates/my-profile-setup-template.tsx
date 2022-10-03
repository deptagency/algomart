import useTranslation from 'next-translate/useTranslation'
import React, { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import {
  Currency,
  Language,
  Submit,
  Username,
} from '@/components/auth-inputs/auth-inputs'
import { H1 } from '@/components/heading'
import { AuthState } from '@/contexts/auth-context'

export interface MyProfileSetupTemplateProps {
  error: string | null
  formErrors: Partial<{
    username?: unknown
    language?: unknown
    currency?: unknown
  }>
  handleCreateProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>
  status: AuthState['status']
}

export default function MyProfileSetupTemplate({
  error,
  formErrors,
  handleCreateProfile,
  status,
}: MyProfileSetupTemplateProps) {
  const { t } = useTranslation()
  return (
    <>
      <H1 mb={12} center uppercase>
        {t('auth:Setup your account')}
      </H1>
      <p className="mb-8 text-center">{t('auth:Please setup your account')}</p>
      <form
        className="relative max-w-sm mx-auto"
        onSubmit={handleCreateProfile}
      >
        {status === 'error' && error && (
          <AlertMessage className="mb-6" content={error} variant="red" />
        )}
        <Username error={formErrors.username} />
        <Language error={formErrors.language} />
        <Currency error={formErrors.currency} />
        <div className="mt-8">
          <Submit disabled={status === 'loading'} />
        </div>
      </form>
    </>
  )
}
