import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { SelectOption } from '@/components/select/select'
import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import DefaultLayout from '@/layouts/default-layout'
import authService from '@/services/auth-service'
import SignupTemplate from '@/templates/signup-template'
import { FileWithPreview } from '@/types/file'
import { validateEmailAndPasswordRegistration } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export default function SignUpPage() {
  const auth = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const currency = useCurrency()
  const { redeemable } = useRedemption()
  const { t } = useTranslation()

  const validate = useMemo(() => validateEmailAndPasswordRegistration(t), [t])
  const [dropdownLanguage, setDropdownLanguage] = useState<string>(locale)
  const [dropdownCurrency, setDropdownCurrency] = useState<string>(currency)
  const [profilePic, setProfilePic] = useState<FileWithPreview | null>(null)
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>(
    {}
  )

  const handleCreateProfile = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const body = {
        currency: dropdownCurrency,
        email: formData.get('email') as string,
        username: formData.get('username') as string,
        locale: dropdownLanguage,
        password: formData.get('password') as string,
        passphrase: formData.get('passphrase') as string,
        profilePic: profilePic as FileWithPreview,
      }

      setFormErrors({})
      const validation = await validate(body)
      if (validation.state === 'invalid' && validation.errors) {
        return setFormErrors(validation.errors)
      }
      const isUsernameAvailable = await authService.isUsernameAvailable(
        body.username
      )
      if (!isUsernameAvailable) {
        setFormErrors((errors) => {
          return { ...errors, username: t('forms:errors.usernameTaken') }
        })
        return
      }

      const result = await auth.registerWithEmailAndPassword(body)
      if (result.isValid) {
        await auth.reloadProfile()

        router.push(redeemable ? urls.login : urls.home, router.asPath, {
          locale: body.locale,
        })
      }
    },
    [
      auth,
      redeemable,
      router,
      profilePic,
      t,
      validate,
      dropdownCurrency,
      dropdownLanguage,
    ]
  )

  const handleProfilePicAccept = useCallback((files: File[]) => {
    setProfilePic(
      Object.assign(files[0], { preview: URL.createObjectURL(files[0]) })
    )
  }, [])

  const handleProfilePicClear = useCallback(() => {
    setProfilePic(null)
  }, [])

  const handleLanguageChange = useCallback((selectOption: SelectOption) => {
    setDropdownLanguage(selectOption.id as string)
  }, [])

  const handleCurrencyChange = useCallback((selectOption: SelectOption) => {
    setDropdownCurrency(selectOption.id as string)
  }, [])

  useEffect(() => {
    if (auth.status === 'authenticated') {
      // prevent authenticated users from trying to register
      router.push(urls.home)
    }
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    setDropdownLanguage(locale)
  }, [locale])

  useEffect(() => {
    setDropdownCurrency(currency)
  }, [currency])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Sign Up')} panelPadding>
      <SignupTemplate
        dropdownCurrency={dropdownCurrency}
        dropdownLanguage={dropdownLanguage}
        handleCreateProfile={handleCreateProfile}
        handleCurrencyChange={handleCurrencyChange}
        handleLanguageChange={handleLanguageChange}
        handleProfilePicAccept={handleProfilePicAccept}
        handleProfilePicClear={handleProfilePicClear}
        error={auth.error}
        formErrors={formErrors}
        profilePic={profilePic}
        status={auth.status}
      />
    </DefaultLayout>
  )
}
