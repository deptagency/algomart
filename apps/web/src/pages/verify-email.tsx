import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useState } from 'react'

import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import VerifyEmailTemplate from '@/templates/verify-email-template'

export default function VerifyEmailPage({ oobCode }) {
  const router = useRouter()
  const { verifyEmailVerificationCode, user, isAuthenticating } = useAuth()
  const [validVerification, setValidVerification] = useState<boolean>(false)
  const [isVerifying, setIsVerifying] = useState<boolean>(true)
  const { t } = useTranslation()

  useEffect(() => {
    async function verify() {
      try {
        await verifyEmailVerificationCode(oobCode)
        setValidVerification(true)
      } catch {
        setValidVerification(false)
      } finally {
        setIsVerifying(false)
      }
    }

    // Only verify if not loading or loaded and user not verified
    if (!isAuthenticating && !user?.emailVerified) {
      verify()
    }
  }, [verifyEmailVerificationCode, oobCode, isAuthenticating]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user?.emailVerified) {
      setValidVerification(true)
      setIsVerifying(false)
    }
  }, [user?.emailVerified, router])

  return (
    <DefaultLayout pageTitle={t('common:pageTitles.Verify Email')} panelPadding>
      {isVerifying ? (
        <Loading />
      ) : (
        <VerifyEmailTemplate validVerification={validVerification} />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const oobCode = (query?.oobCode as string) || null

  return {
    props: {
      oobCode,
    },
  }
}
