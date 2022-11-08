import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import { useFinishProfileSetup } from '@/hooks/api/use-finish-profile-setup'
import DefaultLayout from '@/layouts/default-layout'
import MyProfileSetupTemplate from '@/templates/my-profile-setup-template'
import { validateNonEmailSetup } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export default function MyProfileSetupPage() {
  const auth = useAuth()
  const { redeemable } = useRedemption()
  const router = useRouter()
  const { t } = useTranslation()
  const { mutate: finishProfileSetup } = useFinishProfileSetup()

  const validate = useMemo(() => validateNonEmailSetup(t), [t])
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>(
    {}
  )

  const handleCreateProfile = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)

      const body = {
        language: formData.get('language') as string,
        username: formData.get('username') as string,
        currency: formData.get('currency') as string,
        email: auth.user?.email,
      }

      setFormErrors({})
      const validation = await validate(body)
      if (validation.state === 'invalid' && validation.errors) {
        return setFormErrors(validation.errors)
      }

      finishProfileSetup(body, {
        onSuccess: async () => {
          await auth.reloadProfile()
          auth.completeRedirect(redeemable ? urls.login : urls.home)
        },
        onError: (error) => {
          error.response.status === 409
            ? setFormErrors((errors) => {
                return {
                  ...errors,
                  username: t('forms:errors.usernameTaken'),
                }
              })
            : setFormErrors((errors) => {
                return {
                  ...errors,
                  username: t('forms:errors.accountAlreadyConfigured'),
                }
              })
        },
      })
    },
    [auth, finishProfileSetup, redeemable, t, validate]
  )

  useEffect(() => {
    if (!auth.isNeedsSetup) {
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
