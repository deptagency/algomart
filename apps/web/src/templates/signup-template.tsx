import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import {
  Email,
  Passphrase,
  Password,
  ProfileImage,
  Submit,
  Username,
} from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import { AuthState } from '@/types/auth'
import { FileWithPreview } from '@/types/file'

export interface SignupTemplateProps {
  error: string | null
  formErrors: Partial<{
    email?: unknown
    username?: unknown
    password?: unknown
    passphrase?: unknown
  }>
  handleCreateProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleProfilePicAccept: (files: File[]) => void
  handleProfilePicClear: () => void
  profilePic: FileWithPreview | null
  status: AuthState['status']
  legacyEmail: string | undefined
}

export default function SignupTemplate({
  error,
  formErrors,
  handleCreateProfile,
  handleProfilePicAccept,
  handleProfilePicClear,
  profilePic,
  status,
  legacyEmail,
}: SignupTemplateProps) {
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
          <AlertMessage
            className="mb-6"
            content={t('forms:errors.emailAlreadyInUse')}
            variant="red"
          />
        )}
        <Email defaultValue={legacyEmail} error={formErrors.email} t={t} />
        <Username error={formErrors.username} t={t} />
        <Password error={formErrors.password} t={t} />
        <ProfileImage
          handleProfilePicAccept={handleProfilePicAccept}
          handleProfilePicClear={handleProfilePicClear}
          t={t}
          profilePic={profilePic}
        />
        <Passphrase error={formErrors.passphrase} t={t} />
        <Submit disabled={status === 'loading'} t={t} />
      </form>
    </>
  )
}
