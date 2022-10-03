import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import common from './my-profile-common.module.css'

import { H2 } from '@/components/heading'
import MyProfileAge from '@/components/profile/my-profile-age'
import MyProfileCurrency from '@/components/profile/my-profile-currency'
import MyProfileLanguage from '@/components/profile/my-profile-language'

export interface MyProfilePersonalSettingsSectionProps {
  onUpdateSuccess: (message: string) => void
  onError: (message: string) => void
}

const PersonalSettings = () => {
  const { t } = useTranslation()
  const [formError, setFormError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')
  const handleError = (error: string) => setFormError(error)
  const handleUpdateSuccess = (message: string) => setUpdateSuccess(message)

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <H2 className={common.sectionHeading}>
          {t('forms:fields.personalSettings.label')}
        </H2>
        {updateSuccess && (
          <div
            data-e2e="profile-update-success"
            className={common.confirmation}
          >
            {updateSuccess}
          </div>
        )}
        {formError && <div className={common.error}>{formError}</div>}
      </div>
      <div className={common.sectionContent}>
        <MyProfileCurrency
          onUpdateSuccess={handleUpdateSuccess}
          onError={handleError}
        />
        <MyProfileLanguage
          onUpdateSuccess={handleUpdateSuccess}
          onError={handleError}
        />
        <MyProfileAge
          onUpdateSuccess={handleUpdateSuccess}
          onError={handleError}
        />
      </div>
    </section>
  )
}

export default PersonalSettings
