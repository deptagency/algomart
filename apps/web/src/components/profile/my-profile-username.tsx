import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import common from './my-profile-common.module.css'
import css from './my-profile-username.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
import Input from '@/components/input'
import { useAuth } from '@/contexts/auth-context'
import { AuthService } from '@/services/auth-service'
import { validateUsername } from '@/utils/auth-validation'

export default function MyProfileUsername() {
  const { user, reloadProfile } = useAuth()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const { t } = useTranslation()

  const validate = useMemo(() => validateUsername(t), [t])

  const handleUpdateUsername = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSubmitting(true)
      setUpdateError('')
      setUpdateSuccess(false)

      const body = { username }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setFormErrors(bodyValidation.errors)
        setSubmitting(false)
        return
      }

      // Update username
      try {
        await AuthService.instance.updateUsername(body.username)
      } catch (error) {
        if (error?.response?.status === 409) {
          setUpdateError(t('forms:errors.usernameTaken'))
        } else {
          setUpdateError(t('common:statuses.An Error has Occurred'))
        }
        setSubmitting(false)
        return
      }

      await reloadProfile()
      setSubmitting(false)
      setIsEditing(false)
      setFormErrors({})
      setUpdateError('')
      setUpdateSuccess(true)
      return
    },
    [reloadProfile, t, validate, username]
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
    setUsername(user.username)
  }, [user.username])

  const errorMessage = (formErrors?.username as string) || updateError

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <H2 className={common.sectionHeading}>
          {t('forms:fields.username.label')}
        </H2>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetUsernameConfirmation')}
          </div>
        )}
        {errorMessage && <div className={common.error}>{errorMessage}</div>}
      </div>
      <div className={common.sectionContent}>
        <form className={common.form} onSubmit={handleUpdateUsername}>
          <div className={css.inputWrapper}>
            <Input
              // Poppins "@" sits low on baseline and needs a little help
              startAdornment={<div className="-mt-px">@</div>}
              hasError={!!errorMessage}
              disabled={!isEditing}
              onChange={setUsername}
              value={username}
            />
            {isEditing ? (
              <>
                <Button disabled={!username} busy={submitting} type="submit">
                  {t('common:actions.Save')}
                </Button>
                <Button
                  className={css.cancelButton}
                  onClick={handleCancelEdit}
                  variant="link"
                >
                  {t('common:actions.Cancel')}
                </Button>
              </>
            ) : (
              <Button
                className={css.editButton}
                onClick={handleBeginEdit}
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
