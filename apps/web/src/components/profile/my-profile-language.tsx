import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import common from './my-profile-common.module.css'
import css from './my-profile-language.module.css'

import { Language } from '@/components/auth-inputs/auth-inputs'
import Heading from '@/components/heading'
import { useLanguage } from '@/contexts/language-context'

export default function MyProfileLanguage() {
  const { language, updateLanguage } = useLanguage()
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { t } = useTranslation()

  const handleUpdateLanguage = useCallback(
    (language) => {
      setError('')
      setSuccessMessage('')
      updateLanguage(language).then((success) => {
        if (success) {
          setError('')
          setSuccessMessage(t('profile:resetLanguageConfirmation'))
          setTimeout(() => setSuccessMessage(''), 3000)
        } else {
          setError(t('common:statuses.An Error has Occurred'))
        }
      })
    },
    [t]
  )

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.languages.label')}
        </Heading>
        {successMessage && (
          <div className={common.confirmation}>{successMessage}</div>
        )}
        {error && <div className={common.error}>{error}</div>}
      </div>
      <div className={common.sectionContent}>
        <div className={css.inputWrapper}>
          <Language
            showLabel={false}
            value={language}
            onChange={handleUpdateLanguage}
          />
        </div>
      </div>
    </section>
  )
}
