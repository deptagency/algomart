import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import LoginTemplate from '@/templates/login-template'
import { urls } from '@/utils/urls'

export default function LoginPage() {
  const auth = useAuth()
  const { redeemable } = useRedemption()
  const router = useRouter()
  const { t } = useTranslation()

  const isAuthenticated = auth.status === 'authenticated'
  const isRegistered = !!(auth.user?.username && auth.user?.address)

  const handleRedeemEdition = useCallback(() => {
    if (redeemable) {
      router.push(urls.release.replace(':packSlug', redeemable.pack.slug))
    }
  }, [redeemable, router])

  useEffect(() => {
    // If the user authenticates through google but hasn't set up their profile, make them do so
    if (
      isAuthenticated &&
      auth.user &&
      !isRegistered &&
      auth.method === 'google'
    ) {
      router.push(urls.myProfileSetup)
    } else if (isAuthenticated) {
      // Once authenticated, check if the user needs to be redirected
      // If not, keep the user here if they have a redeemable
      // Otherwise, send the user to the homepage
      const redirectPath = auth.getRedirectPath()
      if (redirectPath) {
        auth.setRedirectPath(null)
        router.push(redirectPath)
      } else if (!redeemable) router.push(urls.home)
    }
  }, [auth, isAuthenticated, isRegistered, redeemable, router])

  useEffect(() => {
    if (router.query.redirect && typeof router.query.redirect === 'string') {
      auth.setRedirectPath(router.query.redirect)
    }
  }, [auth, router])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Login')}>
      <LoginTemplate
        handleLoginEmail={() => router.push(urls.loginEmail)}
        handleLoginGoogle={auth.authenticateWithGoogle}
        handleRedeemEdition={handleRedeemEdition}
        isRegistered={isRegistered}
        redeemable={redeemable}
        status={auth.status}
      />
    </DefaultLayout>
  )
}
