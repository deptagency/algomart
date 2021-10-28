import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import common from './my-profile-common.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'

export default function MyProfileImage() {
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
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.password.label')}
        </Heading>
        {resetSent && (
          <div className={common.confirmation}>
            {t('profile:resetPasswordConfirmation')}
          </div>
        )}
      </div>
      <div className={common.sectionContentLarge}>
        <p className={common.sectionText}>{t('profile:resetPasswordPrompt')}</p>
        <Button
          disabled={loading || resetSent}
          onClick={handleResetPassword}
          size="small"
        >
          {t('auth:Reset Password')}
        </Button>
      </div>
    </section>
  )
}
