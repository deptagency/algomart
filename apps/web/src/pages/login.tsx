import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect } from 'react'

import { useAuth } from '@/contexts/auth-context'
import { useRedemption } from '@/contexts/redemption-context'
import DefaultLayout from '@/layouts/default-layout'
import LoginTemplate from '@/templates/login-template'
import { urlFor, urls } from '@/utils/urls'

export default function LoginPage() {
  const auth = useAuth()
  const { redeemable } = useRedemption()
  const router = useRouter()
  const { t } = useTranslation()
  const loading =
    auth.status === 'loading' || (auth.isAuthenticated && !auth.isRegistered)

  const handleRedeemEdition = useCallback(() => {
    if (redeemable) {
      router.push(urlFor(urls.releasePack, { packSlug: redeemable.pack.slug }))
    }
  }, [redeemable, router])

  useEffect(() => {
    if (auth.isAuthenticated && !auth.isNeedsSetup) {
      // Once authenticated, check if the user needs to be redirected
      // If not, keep the user here if they have a redeemable
      // Otherwise, send the user to the homepage
      if (auth.getRedirectPath()) {
        auth.completeRedirect()
      } else if (!redeemable) {
        router.push(urls.home)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    auth.user,
    auth.status,
    auth.isAuthenticated,
    auth.isRegistered,
    redeemable,
    router,
  ])

  useEffect(() => {
    if (router.query.redirect && typeof router.query.redirect === 'string') {
      auth.setRedirectPath(router.query.redirect)
    }
  }, [auth, router])

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Login')}
      variant="colorful"
      noPanel
    >
      <LoginTemplate
        handleRedeemEdition={handleRedeemEdition}
        handleLoginGoogle={auth.authenticateWithGoogle}
        isAuthenticated={auth.isAuthenticated}
        loading={loading}
        redeemable={redeemable}
        error={auth.error}
      />
    </DefaultLayout>
  )
}
