import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useEffect } from 'react'

import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import SignupTemplate from '@/templates/signup-template'
import { urls } from '@/utils/urls'

export default function SignUpPage() {
  const { authenticateWithGoogle, setRedirectPath, user } = useAuth()
  const router = useRouter()
  const { push } = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    if (user) {
      push(urls.home)
    }
  }, [push, user])

  useEffect(() => {
    if (router.query.redirect && typeof router.query.redirect === 'string') {
      setRedirectPath(router.query.redirect)
    }
  }, [setRedirectPath, router])

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Sign Up')}
      panelPadding
      noPanel
      variant="colorful"
    >
      <SignupTemplate handleLoginGoogle={authenticateWithGoogle} />
    </DefaultLayout>
  )
}
