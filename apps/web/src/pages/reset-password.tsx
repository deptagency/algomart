import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { useAuth } from '@/contexts/auth-context'
import DefaultLayout from '@/layouts/default-layout'
import ResetPasswordTemplate from '@/templates/reset-password-template'
import { validatePasswordReset } from '@/utils/auth-validation'
import { urls } from '@/utils/urls'

export default function ResetPasswordPage() {
  const auth = useAuth()
  const router = useRouter()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [resetSent, setResetSent] = useState<boolean>(false)
  const { t } = useTranslation()

  const validate = useMemo(() => validatePasswordReset(t), [t])

  const handleResetPassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setResetSent(false)
      const formData = new FormData(event.currentTarget)
      const body = {
        email: formData.get('email') as string,
      }
      const validation = await validate(body)
      if (validation.isValid) {
        await auth.sendPasswordReset(body.email)
        setResetSent(true)
      } else {
        setFormErrors(validation.errors)
      }
    },
    [auth, validate]
  )

  useEffect(() => {
    if (auth.status === 'authenticated') {
      // prevent authenticated users from trying to reset passwrod
      router.push(urls.home)
    }
  }, [auth, router])

  return (
    <DefaultLayout
      pageTitle={t('common:pageTitles.Reset Password')}
      panelPadding
    >
      <ResetPasswordTemplate
        formErrors={formErrors}
        handleResetPassword={handleResetPassword}
        resetSent={resetSent}
        status={auth.status}
      />
    </DefaultLayout>
  )
}
