import { DEFAULT_LANG } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import common from './my-profile-common.module.css'
import css from './my-profile-language.module.css'

import { Language } from '@/components/auth-inputs/auth-inputs'
import Button from '@/components/button'
import Heading from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'
import { useLanguage } from '@/hooks/use-language'
import { AuthService } from '@/services/auth-service'
import { validateLanguage } from '@/utils/auth-validation'

export default function MyProfileLanguage() {
  const language = useLanguage()
  const { user, reloadProfile } = useAuth()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [formLanguage, setFormLanguage] = useState<string>(useLanguage())
  const [loading, setLoading] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<string>('')
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const { t } = useTranslation()
  const router = useRouter()

  const validate = useMemo(() => validateLanguage(), [])

  const handleUpdateLanguage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoading(true)
      setUpdateError('')
      setUpdateSuccess(false)

      // Validate form body
      const body = {
        language: formLanguage,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setFormErrors(bodyValidation.errors)
        setLoading(false)
        return
      }

      // Update language
      const updateLanguage = await AuthService.instance.updateLanguage(
        body.language
      )
      if (!updateLanguage) {
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

      router.push(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale: body?.language }
      )

      return
    },
    [reloadProfile, t, validate, formLanguage, router]
  )

  const handleBeginEdit = useCallback(() => {
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(true)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setFormLanguage(user.language || DEFAULT_LANG)
    setFormErrors({})
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(false)
  }, [user])

  useEffect(() => {
    setFormLanguage(language)
  }, [language])

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.languages.label')}
        </Heading>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetLanguageConfirmation')}
          </div>
        )}
        {(formErrors?.language || updateError) && (
          <div className={common.error}>
            {(formErrors?.language as string) || updateError}
          </div>
        )}
      </div>
      <div className={common.sectionContent}>
        <form className={common.form} onSubmit={handleUpdateLanguage}>
          <div className={css.inputWrapper}>
            <Language
              disabled={!isEditing}
              showLabel={false}
              value={formLanguage}
              onChange={setFormLanguage}
            />
            {isEditing ? (
              <>
                <Button
                  className={css.saveButton}
                  disabled={loading}
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
