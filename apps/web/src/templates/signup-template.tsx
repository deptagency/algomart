import useTranslation from 'next-translate/useTranslation'
import React, { FormEvent } from 'react'

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
import { AuthState } from '@/types/auth'
import { FileWithPreview } from '@/types/file'

export interface SignupTemplateProps {
  dropdownCurrency: string
  dropdownLanguage: string
  error: string | null
  formErrors: Partial<{
    currency?: unknown
    email?: unknown
    language?: unknown
    username?: unknown
    password?: unknown
    passphrase?: unknown
  }>
  handleCreateProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleCurrencyChange: (value: string) => void
  handleLanguageChange: (value: string) => void
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
        <Email error={formErrors.email} />
        <Username error={formErrors.username} />
        <Password error={formErrors.password} />
        <ProfileImage
          handleProfilePicAccept={handleProfilePicAccept}
          handleProfilePicClear={handleProfilePicClear}
          profilePic={profilePic}
        />
        <Language
          error={formErrors.language}
          value={dropdownLanguage}
          onChange={handleLanguageChange}
        />
        <Currency
          error={formErrors.currency}
          value={dropdownCurrency}
          onChange={handleCurrencyChange}
        />
        <Passphrase error={formErrors.passphrase} />
        <Submit disabled={status === 'loading'} />
      </form>
    </>
  )
}
