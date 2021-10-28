import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import {
  Passphrase,
  Submit,
  Username,
} from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import Notification from '@/components/notification/notification'
import { AuthState } from '@/types/auth'

export interface MyProfileSetupTemplateProps {
  error: string | null
  formErrors: Partial<{
    username?: unknown
    passphrase?: unknown
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
          <Notification className="mb-6" content={error} variant="red" />
        )}
        <Username error={formErrors.username} t={t} />
        <Passphrase error={formErrors.passphrase} t={t} />
        <Submit disabled={status === 'loading'} t={t} />
      </form>
    </>
  )
}
