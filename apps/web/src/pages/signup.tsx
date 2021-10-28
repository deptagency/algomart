import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import authService from '@/services/auth-service'
import SignupTemplate from '@/templates/signup-template'
import { FileWithPreview } from '@/types/file'
import { validateEmailAndPasswordRegistration } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export default function SignUpPage() {
  const auth = useAuth()
  const router = useRouter()
  const { redeemable } = useRedemption()
  const { t } = useTranslation()

  const validate = useMemo(() => validateEmailAndPasswordRegistration(t), [t])
  const [profilePic, setProfilePic] = useState<FileWithPreview | null>(null)
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>(
    {}
  )

  const handleCreateProfile = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const body = {
        email: formData.get('email') as string,
        username: formData.get('username') as string,
        password: formData.get('password') as string,
        passphrase: formData.get('passphrase') as string,
        profilePic: profilePic as FileWithPreview,
      }

      setFormErrors({})
      const validation = await validate(body)
      if (!validation.isValid && validation.errors) {
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
        router.push(redeemable ? urls.login : urls.home)
      }
    },
    [auth, redeemable, router, profilePic, t, validate]
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

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Sign Up')} panelPadding>
      <SignupTemplate
        handleCreateProfile={handleCreateProfile}
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
