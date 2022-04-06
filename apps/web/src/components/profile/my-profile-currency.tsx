import { CURRENCY_COOKIE, DEFAULT_CURRENCY } from '@algomart/schemas'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import common from './my-profile-common.module.css'
import css from './my-profile-language.module.css'

import { Currency } from '@/components/auth-inputs/auth-inputs'
import Button from '@/components/button'
import Heading from '@/components/heading'
import { useAuth } from '@/contexts/auth-context'
import { useCurrency } from '@/hooks/use-currency'
import { AuthService } from '@/services/auth-service'
import { validateCurrency } from '@/utils/auth-validation'
import { setCookie } from '@/utils/cookies-web'

export default function MyProfileCurrency() {
  const { user, reloadProfile } = useAuth()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [currency, setCurrency] = useState<string>(useCurrency())
  const [loading, setLoading] = useState<boolean>(false)
  const [updateError, setUpdateError] = useState<string>('')
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const { t } = useTranslation()
  const router = useRouter()

  const validate = useMemo(() => validateCurrency(t), [t])

  const handleUpdateCurrency = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoading(true)
      setUpdateError('')
      setUpdateSuccess(false)

      // Validate form body
      const body = {
        currency,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'invalid') {
        setFormErrors(bodyValidation.errors)
        setLoading(false)
        return
      }

      // Update language
      const updateCurrency = await AuthService.instance.updateCurrency(
        body.currency
      )
      if (!updateCurrency) {
        setUpdateError(t('common:statuses.An Error has Occurred'))
        setLoading(false)
        return
      }

      setCookie(CURRENCY_COOKIE, currency, 365)
      await reloadProfile()
      setLoading(false)
      setIsEditing(false)
      setFormErrors({})
      setUpdateError('')
      setUpdateSuccess(true)

      router.push(
        { pathname: router.pathname, query: router.query },
        router.asPath
      )

      return
    },
    [reloadProfile, t, validate, router, currency]
  )

  const handleBeginEdit = useCallback(() => {
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(true)
  }, [])

  const handleCancelEdit = useCallback(() => {
    setCurrency(user.currency || DEFAULT_CURRENCY)
    setFormErrors({})
    setUpdateError('')
    setUpdateSuccess(false)
    setIsEditing(false)
  }, [user])

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <Heading className={common.sectionHeading} level={2}>
          {t('forms:fields.currencies.label')}
        </Heading>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetCurrencyConfirmation')}
          </div>
        )}
        {(formErrors?.currency || updateError) && (
          <div className={common.error}>
            {(formErrors?.currency as string) || updateError}
          </div>
        )}
      </div>
      <div className={common.sectionContent}>
        <form className={common.form} onSubmit={handleUpdateCurrency}>
          <div className={css.inputWrapper}>
            <Currency
              disabled={!isEditing}
              showLabel={false}
              value={currency}
              onChange={setCurrency}
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
