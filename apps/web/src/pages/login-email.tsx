import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import LoginEmailTemplate from '@/templates/login-email-template'
import { urls } from '@/utils/urls'

export default function LoginEmailPage() {
  const auth = useAuth()
  const [loading, setLoading] = useState<boolean>(false)
  const { redeemable } = useRedemption()
  const router = useRouter()
  const { t } = useTranslation()

  const handleLogin = useCallback(
    async (body: { email: string; password: string }) => {
      setLoading(true)
      const result = await auth.authenticateWithEmailAndPassword(body)
      if (result.isValid) {
        auth.completeRedirect(redeemable ? urls.login : urls.home)
      } else {
        // Explicitly in else to account for router changes being asynchronous
        setLoading(false)
      }
    },
    [auth, redeemable]
  )

  useEffect(() => {
    auth.resetAuthErrors()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (auth.status === 'authenticated') {
      // prevent authenticated users from trying to login
      router.push(urls.home)
    }
  }, [auth, router])

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Login')}
      noPanel
      variant="colorful"
    >
      <LoginEmailTemplate
        handleLogin={handleLogin}
        loading={loading}
        authError={auth.error}
      />
    </DefaultLayout>
  )
}
