import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import common from './my-profile-common.module.css'
import css from './my-profile-username.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import TextInput from '@/components/text-input/text-input'
import { useAuth } from '@/contexts/auth-context'
import authService from '@/services/auth-service'
import { validateUsername } from '@/utils/auth-validation'

export default function MyProfileUsername() {
  const { user, reloadProfile } = useAuth()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [username, setUsername] = useState<string>(user?.username || '')
  const [updateError, setUpdateError] = useState<string>('')
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const { t } = useTranslation()

  const validate = useMemo(() => validateUsername(t), [t])

  const handleUpdateUsername = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoading(true)
      setUpdateError('')
      setUpdateSuccess(false)

      // Validate form body
      const formData = new FormData(event.currentTarget)
      const body = {
        username: formData.get('username') as string,
      }
      const bodyValidation = await validate(body)
      if (!bodyValidation.isValid) {
        setFormErrors(bodyValidation.errors)
        setLoading(false)
        return
      }

      // Check if username exists
      const isUsernameAvailable = await authService.isUsernameAvailable(
        body.username
      )
      if (!isUsernameAvailable) {
        setLoading(false)
        return setFormErrors((errors) => ({
          ...errors,
          username: t('forms:errors.usernameTaken'),
        }))
      }

      // Update username
      const updateUsername = await authService.updateUsername(body.username)
      if (!updateUsername) {
        setUpdateError(t('common:statuses.An Error has Occurred'))
        setLoading(false)
        return
      }
      await reloadProfile()
      setLoading(false)
      setIsEditing(false)
      setFormErrors({})
      setUpdateError('')
      setUpdateSuccess(true)
      return
    },
    [reloadProfile, t, validate]
  )

  const handleBeginEdit = useCallback(() => {
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(true)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setFormErrors({})
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(false)
  }, [])

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.username.label')}
        </Heading>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetUsernameConfirmation')}
          </div>
        )}
        {(formErrors?.username || updateError) && (
          <div className={common.error}>
            {(formErrors?.username as string) || updateError}
          </div>
        )}
      </div>
      <div className={common.sectionContent}>
        <form className={common.form} onSubmit={handleUpdateUsername}>
          <div className={css.inputWrapper}>
            <TextInput
              disabled={!isEditing}
              error={(formErrors?.username as string) || updateError}
              id="username"
              name="username"
              onChange={({ target }) => setUsername(target.value)}
              value={isEditing ? username : `@${user?.username as string}`}
            />
            {isEditing ? (
              <>
                <Button
                  className={css.saveButton}
                  disabled={loading || !username}
                  size="small"
                  type="submit"
                >
                  {t('common:actions.Save')}
                </Button>
                <Button
                  className={css.cancelButton}
                  onClick={handleCancelEdit}
                  size="small"
                  variant="link"
                >
                  {t('common:actions.Cancel')}
                </Button>
              </>
            ) : (
              <Button
                className={css.editButton}
                onClick={handleBeginEdit}
                size="small"
                variant="link"
              >
                {t('common:actions.Edit')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
