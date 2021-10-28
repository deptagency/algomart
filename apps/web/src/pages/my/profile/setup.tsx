import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import authService from '@/services/auth-service'
import MyProfileSetupTemplate from '@/templates/my-profile-setup-template'
import { validateUserRegistration } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export default function MyProfileSetupPage() {
  const auth = useAuth()
  const { redeemable } = useRedemption()
  const router = useRouter()
  const { t } = useTranslation()

  const validate = useMemo(() => validateUserRegistration(t), [t])
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>(
    {}
  )

  const handleCreateProfile = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const body = {
        passphrase: formData.get('passphrase') as string,
        username: formData.get('username') as string,
        email: auth.user?.email,
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
        return setFormErrors((errors) => ({
          ...errors,
          username: t('forms:errors.usernameTaken'),
        }))
      }

      const result = await fetch(urls.api.v1.profile, {
        method: 'POST',
        headers: {
          authorization: `bearer ${auth.user?.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!result.ok) {
        return setFormErrors((errors) => {
          return {
            ...errors,
            username: t('forms:errors.accountAlreadyConfigured'),
          }
        })
      }
      await auth.reloadProfile()
      router.push(redeemable ? urls.login : urls.home)
    },
    [auth, redeemable, router, t, validate]
  )

  useEffect(() => {
    if (
      auth.status === 'authenticated' &&
      auth.user !== null &&
      auth.user?.username &&
      auth.user?.address
    ) {
      // prevent existing users from creating new profiles
      router.push(urls.home)
    }
  }, []) /* eslint-disable-line react-hooks/exhaustive-deps */

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Profile Setup')}
      panelPadding
    >
      <MyProfileSetupTemplate
        error={auth.error}
        formErrors={formErrors}
        handleCreateProfile={handleCreateProfile}
        status={auth.status}
      />
    </DefaultLayout>
  )
}
