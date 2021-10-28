import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import LoginEmailTemplate from '@/templates/login-email-template'
import { validateLogin } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export default function LoginEmailPage() {
  const auth = useAuth()
  const { redeemable } = useRedemption()
  const router = useRouter()
  const { t } = useTranslation()

  const validate = useMemo(() => validateLogin(t), [t])
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()

  const handleLogin = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const body = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      }
      const validation = await validate(body)
      if (validation.isValid) {
        const result = await auth.authenticateWithEmailAndPassword(body)
        if (result.isValid) {
          // Check if the user needs to be redirected
          // If not, check if they have a redeemable and if so, send to login page
          // Otherwise, send the user to the homepage
          const redirectPath = auth.getRedirectPath()

          if (redirectPath) {
            auth.setRedirectPath(null)
            router.push(redirectPath)
          } else if (redeemable) router.push(urls.login)
          else router.push(urls.home)
        }
      } else {
        setFormErrors(validation.errors)
      }
    },
    [auth, redeemable, router, validate]
  )

  useEffect(() => {
    if (auth.status === 'authenticated') {
      // prevent authenticated users from trying to login
      router.push(urls.home)
    }
  }, [auth, router])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Login')} panelPadding>
      <LoginEmailTemplate
        error={auth.error}
        formErrors={formErrors}
        handleLogin={handleLogin}
        status={auth.status}
      />
    </DefaultLayout>
  )
}
