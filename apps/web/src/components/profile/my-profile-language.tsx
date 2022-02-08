import { DEFAULT_LOCALE, LOCALE_COOKIE } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import { Language } from '../auth-inputs/auth-inputs'
import { SelectOption } from '../select/select'

import common from './my-profile-common.module.css'
import css from './my-profile-language.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'
import { useLocale } from '@/hooks/use-locale'
import authService from '@/services/auth-service'
import { validateLanguage } from '@/utils/auth-validation'
import { setCookie } from '@/utils/cookies-web'

export default function MyProfileLanguage() {
  const { user, reloadProfile } = useAuth()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [language, setLanguage] = useState<string>(useLocale())
  const [loading, setLoading] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<string>('')
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const { t } = useTranslation()
  const router = useRouter()

  const validate = useMemo(() => validateLanguage(t), [t])

  const handleUpdateLanguage = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoading(true)
      setUpdateError('')
      setUpdateSuccess(false)

      // Validate form body
      const body = {
        language,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setFormErrors(bodyValidation.errors)
        setLoading(false)
        return
      }

      // Update language
      const updateLanguage = await authService.updateLanguage(body.language)
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

      setCookie(LOCALE_COOKIE, body?.language, 365)
      router.push(
        { pathname: router.pathname, query: router.query },
        router.asPath,
        { locale: body?.language }
      )

      return
    },
    [reloadProfile, t, validate, language, router]
  )

  const handleBeginEdit = useCallback(() => {
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(true)
  }, [])

  const handleCancelEdit = useCallback(() => {
    console.log(user)
    setLanguage(user.locale || DEFAULT_LOCALE)
    setFormErrors({})
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(false)
  }, [user])

  const handleLanguageChange = useCallback((selectOption: SelectOption) => {
    setLanguage(selectOption.id as string)
  }, [])

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
        {(formErrors?.locale || updateError) && (
          <div className={common.error}>
            {(formErrors?.locale as string) || updateError}
          </div>
        )}
      </div>
      <div className={common.sectionContent}>
        <form className={common.form} onSubmit={handleUpdateLanguage}>
          <div className={css.inputWrapper}>
            <Language
              disabled={!isEditing}
              showLabel={false}
              value={language}
              handleChange={handleLanguageChange}
              t={t}
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
