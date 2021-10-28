import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import { ExtractError } from 'validator-fns'

import common from './my-profile-common.module.css'
import css from './my-profile-email.module.css'

import Button from '@/components/button'
import Heading from '@/components/heading'
import TextInput from '@/components/text-input/text-input'
import { useAuth } from '@/contexts/auth-context'
import { validateEmailUpdate } from '@/utils/auth-validation'

export default function MyProfileEmail() {
  const { updateAuthSession, updateEmailAddress } = useAuth()
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>()
  const [loading, setLoading] = useState<boolean>(false)
  const [email, setEmail] = useState<string>('')
  const [emailConfirm, setEmailConfirm] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [updateError, setUpdateError] = useState<string | null>('')
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false)
  const { t } = useTranslation()

  const validate = useMemo(() => validateEmailUpdate(t), [t])

  const handleUpdateEmailSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoading(true)
      setUpdateError('')
      setUpdateSuccess(false)
      const formData = new FormData(event.currentTarget)
      const body = {
        email: formData.get('email') as string,
        emailConfirm: formData.get('emailConfirm') as string,
        password: formData.get('password') as string,
      }
      const bodyValidation = await validate(body)
      if (bodyValidation.isValid) {
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
        <Heading className={common.sectionHeading} level={2}>
          {t('profile:Email Address')}
        </Heading>
        {updateSuccess && (
          <div className={common.confirmation}>
            {t('profile:resetEmailConfirmation')}
          </div>
        )}
        {updateError && <div className={common.error}>{updateError}</div>}
      </div>

      <form
        className={common.sectionContentLarge}
        onSubmit={handleUpdateEmailSubmit}
      >
        <Trans
          components={[
            <p className={common.sectionText} key={0} />,
            <em key={1} />,
          ]}
          i18nKey="profile:resetEmailPrompt"
        />
        <div className={css.inputsWrapper}>
          <TextInput
            error={(formErrors?.password as string) || undefined}
            id="password"
            label={t('forms:fields.password.label')}
            name="password"
            onChange={({ target }) => setPassword(target.value)}
            type="password"
            value={password}
          />
          <TextInput
            error={(formErrors?.email as string) || undefined}
            id="email"
            label={t('profile:Confirm new email address')}
            name="email"
            onChange={({ target }) => setEmail(target.value)}
            type="email"
            value={email}
          />
          <TextInput
            error={(formErrors?.emailConfirm as string) || undefined}
            id="emailConfirm"
            label={t('forms:fields.emailConfirm.label')}
            name="emailConfirm"
            onChange={({ target }) => setEmailConfirm(target.value)}
            type="email"
            value={emailConfirm}
          />
          <Button
            disabled={loading || !email || !emailConfirm}
            size="small"
            type="submit"
          >
            {t('common:actions.Change Email')}
          </Button>
        </div>
      </form>
    </section>
  )
}
