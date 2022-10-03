import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import common from './my-profile-common.module.css'

import Button from '@/components/button'
import { H2 } from '@/components/heading'
import InputField from '@/components/input-field'
import { useAuth } from '@/contexts/auth-context'
import { validateEmailUpdate } from '@/utils/auth-validation'

export default function MyProfileEmail() {
  const { updateAuthSession, updateEmailAddress } = useAuth()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [password, setPassword] = useState('')
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const { t } = useTranslation()

  const validate = useMemo(() => validateEmailUpdate(t), [t])

  const handleUpdateEmailSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoading(true)
      setUpdateError('')
      setUpdateSuccess(false)
      const body = { email, emailConfirm, password }
      const bodyValidation = await validate(body)
      if (bodyValidation.state === 'valid') {
        // Validate emails match
        if (email !== emailConfirm) {
          setUpdateError(t('forms:errors.emailsDoNotMatch'))
          setLoading(false)
          return
        }

        // Reauthenticate user
        const { isValid: reAuthenticated } = await updateAuthSession(password)
        if (!reAuthenticated) {
          setUpdateError(t('forms:errors.invalidPassword'))
          setLoading(false)

          return
        }

        // Update email address
        const { isValid: emailUpdated } = await updateEmailAddress(email)
        if (!emailUpdated) {
          setUpdateError(t('forms:errors.emailAlreadyInUse'))
          setLoading(false)
          return
        }

        // Update state
        setPassword('')
        setEmail('')
        setEmailConfirm('')
        setLoading(false)
        setUpdateSuccess(true)
        return
      } else {
        setFormErrors(bodyValidation.errors)
        setLoading(false)
      }
    },
    [
      email,
      emailConfirm,
      password,
      t,
      updateAuthSession,
      updateEmailAddress,
      validate,
    ]
  )

  return (
    <section className={common.section}>
      <div className={common.sectionHeader}>
        <H2 className={common.sectionHeading}>{t('profile:Email Address')}</H2>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetEmailConfirmation')}
          </div>
        )}
        {updateError && <div className={common.error}>{updateError}</div>}
      </div>

      <form
        className={common.sectionContent}
        onSubmit={handleUpdateEmailSubmit}
      >
        <Trans
          components={[
            <p className={common.sectionText} key={0} />,
            <em key={1} />,
          ]}
          i18nKey="profile:resetEmailPrompt"
        />
        <InputField
          error={(formErrors?.password as string) || undefined}
          label={t('forms:fields.password.label')}
          onChange={setPassword}
          type="password"
          value={password}
        />
        <InputField
          autoComplete="off"
          error={(formErrors?.email as string) || undefined}
          label={t('forms:fields.newEmail.label')}
          onChange={setEmail}
          type="email"
          value={email}
        />
        <InputField
          autoComplete="off"
          error={(formErrors?.emailConfirm as string) || undefined}
          label={t('profile:Confirm new email')}
          onChange={setEmailConfirm}
          type="email"
          value={emailConfirm}
        />
        <Button busy={loading} disabled={!email || !emailConfirm} type="submit">
          {t('common:actions.Change Email')}
        </Button>
      </form>
    </section>
  )
}
