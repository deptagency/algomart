import useTranslation from 'next-translate/useTranslation'
import { useCallback } from 'react'

import { MyProfilePersonalSettingsSectionProps } from './my-profile-personal-settings'

import css from './my-profile-personal-settings.module.css'

import { Language } from '@/components/auth-inputs/auth-inputs'
import { useLanguage } from '@/contexts/language-context'

export default function MyProfileLanguage({
  onUpdateSuccess,
  onError,
}: MyProfilePersonalSettingsSectionProps) {
  const { language, updateLanguage } = useLanguage()
  const { t } = useTranslation()

  const handleUpdateLanguage = useCallback(
    (language) => {
      onError('')
      onUpdateSuccess('')
      updateLanguage(language).then((success) => {
        if (success) {
          onError('')
          onUpdateSuccess(t('profile:resetLanguageConfirmation'))
        } else {
          onError(t('common:statuses.An Error has Occurred'))
        }
      })
    },
    [onError, onUpdateSuccess, t, updateLanguage]
  )

  return (
    <div className={css.inputWrapper}>
      <Language
        noMargin
        label=""
        value={language}
        onChange={(language) => handleUpdateLanguage(language)}
      />
      {t('profile:Site Language')}
    </div>
  )
}
