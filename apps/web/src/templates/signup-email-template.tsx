import clsx from 'clsx'
import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent } from 'react'

import AlertMessage from '@/components/alert-message/alert-message'
import AppLink from '@/components/app-link/app-link'
import {
  Currency,
  Email,
  Language,
  Password,
  ProfileImage,
  Submit,
  Username,
} from '@/components/auth-inputs/auth-inputs'
import Checkbox from '@/components/checkbox/checkbox'
import { H1 } from '@/components/heading'
import { AuthState } from '@/contexts/auth-context'
import { FileWithPreview } from '@/types/file'
import { urls } from '@/utils/urls'

export interface SignupEmailTemplateProps {
  dropdownCurrency: string
  dropdownLanguage: string
  error: string | null
  formErrors: Partial<{
    currency?: unknown
    email?: unknown
    language?: unknown
    marketingOptIn?: unknown
    username?: unknown
    password?: unknown
    tos?: unknown
    privacyPolicy?: unknown
  }>
  handleCreateProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>
  handleCurrencyChange: (value: string) => void
  handleLanguageChange: (value: string) => void
  handleProfilePicAccept: (files: File[]) => void
  handleProfilePicClear: () => void
  profilePic: FileWithPreview | null
  status: AuthState['status']
}

export default function SignupEmailTemplate({
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
}: SignupEmailTemplateProps) {
  const { t } = useTranslation()

  return (
    <form
      className="relative max-w-lg mx-auto mb-8 bg-base-bgCard py-6 px-8 rounded-md shadow-lg"
      onSubmit={handleCreateProfile}
    >
      <H1 uppercase mb={2}>
        {t('common:actions.Sign Up')}
      </H1>
      <h2 className="mb-6 text-base font-normal tracking-wider uppercase">
        {t('auth:Create an account to start collecting')}
      </h2>
      {status === 'error' &&
        error &&
        !formErrors.username &&
        !formErrors.email && (
          <AlertMessage
            className="mb-6"
            content={t('forms:errors.accountCreationError')}
            variant="red"
          />
        )}
      <Email error={formErrors.email} variant="light" />
      <Password error={formErrors.password} variant="light" />
      <Username error={formErrors.username} variant="light" />
      <ProfileImage
        variant="light"
        handleProfilePicAccept={handleProfilePicAccept}
        handleProfilePicClear={handleProfilePicClear}
        profilePic={profilePic}
      />
      <Language
        variant="light"
        error={formErrors.language}
        value={dropdownLanguage}
        onChange={handleLanguageChange}
      />
      <Currency
        variant="light"
        error={formErrors.currency}
        value={dropdownCurrency}
        onChange={handleCurrencyChange}
      />

      <div className="py-6">
        {(formErrors.privacyPolicy || formErrors.tos) && (
          <AlertMessage
            className="mb-6"
            content={t('forms:errors.acceptTerms')}
            variant="red"
          />
        )}

        <Checkbox
          id="privacyPolicy"
          className={clsx(
            { 'text-base-error': formErrors.privacyPolicy },
            'pb-3 block'
          )}
          name="privacyPolicy"
          label={
            <Trans
              components={[
                <AppLink
                  key="0"
                  className="underline"
                  target="_blank"
                  href={urls.privacyPolicy}
                />,
              ]}
              i18nKey="forms:fields.privacyPolicy.label"
            />
          }
        />
        <Checkbox
          id="tos"
          name="tos"
          className={clsx({ 'text-base-error': formErrors.tos }, 'pb-3 block')}
          label={
            <Trans
              components={[
                <AppLink
                  key="0"
                  className="underline"
                  target="_blank"
                  href={urls.termsAndConditions}
                />,
              ]}
              i18nKey="forms:fields.tos.label"
            />
          }
        />

        <Checkbox
          id="marketingOptIn"
          className={clsx({ 'text-base-error': formErrors.marketingOptIn })}
          name="marketingOptIn"
          label={t('forms:fields.marketingOptIn.label')}
        />
      </div>

      <Submit
        size="large"
        disabled={status === 'loading'}
        translationKey="common:actions.Sign Up"
      />
    </form>
  )
}
