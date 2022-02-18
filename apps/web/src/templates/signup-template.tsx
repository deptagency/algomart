import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import {
  Currency,
  Email,
  Language,
  Passphrase,
  Password,
  ProfileImage,
  Submit,
  Username,
} from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import { SelectOption } from '@/components/select/select'
import { AuthState } from '@/types/auth'
import { FileWithPreview } from '@/types/file'

export interface SignupTemplateProps {
  dropdownCurrency: string
  dropdownLanguage: string
  error: string | null
  formErrors: Partial<{
    currency?: unknown
    email?: unknown
    username?: unknown
    language?: unknown
    password?: unknown
    passphrase?: unknown
  }>
  handleCreateProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleCurrencyChange: (selectOption: SelectOption) => void
  handleLanguageChange: (selectOption: SelectOption) => void
  handleProfilePicAccept: (files: File[]) => void
  handleProfilePicClear: () => void
  profilePic: FileWithPreview | null
  status: AuthState['status']
}

export default function SignupTemplate({
  dropdownCurrency,
  dropdownLanguage,
  error,
  formErrors,
  handleCreateProfile,
  handleCurrencyChange,
  handleLanguageChange,
  handleProfilePicAccept,
  handleProfilePicClear,
  profilePic,
  status,
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
        <Email error={formErrors.email} t={t} />
        <Username error={formErrors.username} t={t} />
        <Password error={formErrors.password} t={t} />
        <ProfileImage
          handleProfilePicAccept={handleProfilePicAccept}
          handleProfilePicClear={handleProfilePicClear}
          t={t}
          profilePic={profilePic}
        />
        <Language
          error={formErrors.language}
          t={t}
          value={dropdownLanguage}
          handleChange={handleLanguageChange}
        />
        <Currency
          error={formErrors.currency}
          t={t}
          value={dropdownCurrency}
          handleChange={handleCurrencyChange}
        />
        <Passphrase error={formErrors.passphrase} t={t} />
        <Submit disabled={status === 'loading'} t={t} />
      </form>
    </>
  )
}
