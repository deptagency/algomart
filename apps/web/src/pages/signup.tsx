import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { useAuth } from '@/contexts/auth-context'
import { useCurrency } from '@/contexts/currency-context'
import { useLanguage } from '@/contexts/language-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import { AuthService } from '@/services/auth-service'
import SignupTemplate from '@/templates/signup-template'
import { FileWithPreview } from '@/types/file'
import { validateEmailAndPasswordRegistration } from '@/utils/auth-validation'
import { setCurrencyCookie, setLanguageCookie } from '@/utils/cookies-web'
import { urls } from '@/utils/urls'

export default function SignUpPage() {
  const auth = useAuth()
  const router = useRouter()
  const { language } = useLanguage()
  const { currency } = useCurrency()
  const { redeemable } = useRedemption()
  const { t } = useTranslation()

  const validate = useMemo(() => validateEmailAndPasswordRegistration(t), [t])
  const [dropdownLanguage, setDropdownLanguage] = useState<string>(language)
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
        language: dropdownLanguage,
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        passphrase: formData.get('passphrase') as string,
        profilePic: profilePic as FileWithPreview,
      }

      setFormErrors({})
      const validation = await validate(body)
      if (validation.state === 'invalid' && validation.errors) {
        return setFormErrors(validation.errors)
      }
      const isUsernameAvailable =
        await AuthService.instance.isUsernameAvailable(body.username)
      if (!isUsernameAvailable) {
        setFormErrors((errors) => {
          return { ...errors, username: t('forms:errors.usernameTaken') }
        })
        return
      }

      const result = await auth.registerWithEmailAndPassword(body)
      if (result.isValid) {
        setCurrencyCookie(body.currency)
        setLanguageCookie(body.language)
        await auth.reloadProfile()
        router.push(redeemable ? urls.login : urls.home, undefined, {
          locale: body.language,
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

  useEffect(() => {
    if (auth.status === 'authenticated') {
      // prevent authenticated users from trying to register
      router.push(urls.home)
    }
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  useEffect(() => {
    setDropdownLanguage(language)
  }, [language])

  useEffect(() => {
    setDropdownCurrency(currency)
  }, [currency])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Sign Up')} panelPadding>
      <SignupTemplate
        dropdownCurrency={dropdownCurrency}
        dropdownLanguage={dropdownLanguage}
        handleCreateProfile={handleCreateProfile}
        handleCurrencyChange={setDropdownCurrency}
        handleLanguageChange={setDropdownLanguage}
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
