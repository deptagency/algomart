import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import {
  Currency,
  Passphrase,
  Submit,
  Username,
} from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import { AuthState } from '@/types/auth'

export interface MyProfileSetupTemplateProps {
  error: string | null
  formErrors: Partial<{
    username?: unknown
    passphrase?: unknown
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
      <Heading className="mb-8 text-center">
        {t('auth:Setup your account')}
      </Heading>
      <form
        className="relative max-w-sm mx-auto"
        onSubmit={handleCreateProfile}
      >
        {status === 'error' && error && (
          <AlertMessage className="mb-6" content={error} variant="red" />
        )}
        <Username error={formErrors.username} />
        <Passphrase error={formErrors.passphrase} />
        <Currency error={formErrors.currency} />
        <Submit disabled={status === 'loading'} />
      </form>
    </>
  )
}
