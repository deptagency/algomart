import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import common from './my-profile-common.module.css'

import { ProfileImage } from '@/components/auth-inputs/auth-inputs'
import { H2 } from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'
import { FileWithPreview } from '@/types/file'

export default function MyProfileImage() {
  const { updateProfilePic, user, status: authStatus } = useAuth()
  const [profilePicChanged, setProfilePicChanged] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<boolean>(false)
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const { t } = useTranslation()

  // Get existing profile pic
  const preview = user?.photo
  const avatar = preview
    ? Object.assign(new File([], preview), { preview })
    : null

  const [profilePic, setProfilePic] = useState<FileWithPreview | null>(avatar)

  const handleProfilePicClear = useCallback(() => {
    setUpdateSuccess(false)
    setUpdateError(false)
    setProfilePicChanged(true)
    setProfilePic(null)
  }, [])

  const handleProfilePicReject = useCallback(() => {
    setUpdateSuccess(false)
    setProfilePicChanged(false)
    setUpdateError(true)
  }, [])

  useEffect(() => {
    if (authStatus === 'loading' || !profilePicChanged) return
    updateProfilePic(profilePic)
      .then(() => {
        setProfilePicChanged(false)
        setUpdateSuccess(true)
      })
      .catch(() => {
        setUpdateSuccess(false)
        setProfilePicChanged(false)
        setProfilePic(null)
        setUpdateError(true)
      })
  }, [profilePic, updateProfilePic, authStatus, profilePicChanged])

  const handleProfilePicAccept = useCallback((files: File[]) => {
    setUpdateSuccess(false)
    setUpdateError(false)
    setProfilePicChanged(true)
    setProfilePic(
      Object.assign(files[0], { preview: URL.createObjectURL(files[0]) })
    )
  }, [])

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <H2 className={common.sectionHeading}>
          {t('forms:fields.profileImage.label')}
        </H2>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetProfilePicConfirmation')}
          </div>
        )}
        {updateError && (
          <div className={common.error}>
            {t('forms:errors.minImageFileSize', { fileSize: '2MB' })}
          </div>
        )}
      </div>
      <form className={common.sectionContent}>
        <ProfileImage
          noMargin
          noPad
          handleProfilePicAccept={handleProfilePicAccept}
          handleProfilePicClear={handleProfilePicClear}
          handleProfilePicReject={handleProfilePicReject}
          profilePic={profilePic}
          showHelpText={false}
          label=""
        />
      </form>
    </section>
  )
}
