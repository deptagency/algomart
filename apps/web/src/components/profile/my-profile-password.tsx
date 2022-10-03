import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import common from './my-profile-common.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'

export default function MyProfilePassword() {
  const { t } = useTranslation()
  const { user, sendPasswordReset } = useAuth()
  const [loading, setLoading] = useState<boolean>(false)
  const [resetSent, setResetSent] = useState<boolean>(false)

  const handleResetPassword = async () => {
    if (!user?.email) return
    setLoading(true)
    await sendPasswordReset(user.email)
    setLoading(false)
    setResetSent(true)
  }
  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <H2 className={common.sectionHeading}>
          {t('forms:fields.password.label')}
        </H2>
        {resetSent && (
          <div className={common.confirmation}>
            {t('profile:resetPasswordConfirmation')}
          </div>
        )}
      </div>
      <div className={common.sectionContent}>
        <p className={common.sectionText}>{t('profile:resetPasswordPrompt')}</p>
        <Button
          busy={loading}
          disabled={resetSent}
          onClick={handleResetPassword}
        >
          {t('auth:Reset Password')}
        </Button>
      </div>
    </section>
  )
}
