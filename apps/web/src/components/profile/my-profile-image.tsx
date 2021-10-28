import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import common from './my-profile-common.module.css'
import css from './my-profile-image.module.css'

import { ProfileImage } from '@/components/auth-inputs/auth-inputs'
import Button from '@/components/button'
import Heading from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'
import { FileWithPreview } from '@/types/file'

export default function MyProfileImage() {
  const { updateProfilePic, user } = useAuth()
  const [profilePicChanged, setProfilePicChanged] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<boolean>(false)
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const { t } = useTranslation()

  // Get existing profile pic
  const preview = user?.photo
  const avatar = preview
    ? Object.assign(new File([], preview), { preview })
    : null

  const [profilePic, setProfilePic] = useState<FileWithPreview | null>(avatar)

  const handleProfilePicAccept = useCallback((files: File[]) => {
    setUpdateSuccess(false)
    setUpdateError(false)
    setProfilePicChanged(true)
    setProfilePic(
      Object.assign(files[0], { preview: URL.createObjectURL(files[0]) })
    )
  }, [])

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

  const handleProfilePicSubmit = useCallback(async () => {
    setLoading(true)
    await updateProfilePic(profilePic)
    setLoading(false)
    setProfilePicChanged(false)
    setUpdateSuccess(true)
  }, [profilePic, updateProfilePic])

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.profileImage.label')}
        </Heading>
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
      <form className={css.profileImageForm}>
        <ProfileImage
          handleProfilePicAccept={handleProfilePicAccept}
          handleProfilePicClear={handleProfilePicClear}
          handleProfilePicReject={handleProfilePicReject}
          profilePic={profilePic}
          showHelpText={false}
          showLabel={false}
          t={t}
        />
        <Button
          disabled={loading || !profilePicChanged}
          onClick={handleProfilePicSubmit}
          size="small"
        >
          {t('common:actions.Save Changes')}
        </Button>
      </form>
    </section>
  )
}
