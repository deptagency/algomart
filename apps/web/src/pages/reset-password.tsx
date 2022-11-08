import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import Loading from '@/components/loading/loading'
import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import ResetPasswordTemplate from '@/templates/reset-password-template'
import { validatePasswordReset } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export default function ResetPasswordPage({ oobCode }) {
  const {
    verifyResetPasswordCode,
    confirmPassword,
    authenticateWithEmailAndPassword,
    status,
  } = useAuth()
  const router = useRouter()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [invalidReset, setInvalidReset] = useState<boolean>(false)
  const [resetComplete, setResetComplete] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const { t } = useTranslation()

  const validate = useMemo(() => validatePasswordReset(t), [t])

  useEffect(() => {
    async function verify() {
      try {
        const email = await verifyResetPasswordCode(oobCode)
        setEmail(email)
      } catch {
        setInvalidReset(true)
      }
    }
    verify()
  }, [verifyResetPasswordCode, oobCode, router])

  const handleResetPassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const body = {
        password: formData.get('password') as string,
      }
      const validation = await validate(body)
      if (validation.state === 'valid') {
        try {
          await confirmPassword(oobCode, body.password)
          setResetComplete(true)
          await authenticateWithEmailAndPassword({
            email,
            password: body.password,
          })
        } catch {
          setInvalidReset(true)
        }
      } else {
        setFormErrors(validation.errors)
      }
    },
    [
      validate,
      confirmPassword,
      oobCode,
      authenticateWithEmailAndPassword,
      email,
    ]
  )

  useEffect(() => {
    if (status === 'authenticated') {
      // prevent authenticated users from trying to reset passwrod
      router.push(urls.home)
    }
  }, [status, router])

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Reset Password')}
      panelPadding
    >
      {!email && !invalidReset ? (
        <Loading />
      ) : (
        <ResetPasswordTemplate
          formErrors={formErrors}
          handleResetPassword={handleResetPassword}
          status={status}
          invalidReset={invalidReset}
          resetComplete={resetComplete}
        />
      )}
    </DefaultLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const mode = query.mode as string
  const oobCode = query.oobCode as string

  if (mode !== 'resetPassword' || !oobCode) {
    return {
      redirect: {
        destination: urls.sendResetPassword,
        permanent: false,
      },
    }
  }

  return {
    props: {
      oobCode,
    },
  }
}
