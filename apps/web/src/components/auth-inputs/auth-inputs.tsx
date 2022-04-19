import { DEFAULT_LANG } from '@algomart/schemas'
import * as DineroCurrencies from '@dinero.js/currencies'
import {
  CurrencyDollarIcon,
  GlobeAltIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
} from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import React, { ReactNode, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import css from './auth-inputs.module.css'

import Button from '@/components/button'
import FormField from '@/components/form-field'
import PassphraseInput from '@/components/passphrase-input/passphrase-input'
import Select, { SelectOption } from '@/components/select/select'
import TextInput from '@/components/text-input/text-input'
import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLanguage } from '@/hooks/use-language'
import { FileWithPreview } from '@/types/file'

/**
 * Reused components found throughout sign-in, sign-up, and profile create/update flows
 * */

export interface AuthInputProps {
  disabled?: boolean
  error?: string | unknown
  helpLink?: ReactNode
  className?: string
  onChange?(value: string): void
  showLabel?: boolean
  value?: string
}

export function Currency({
  error,
  disabled,
  onChange,
  showLabel = true,
  value,
  className = '',
}: AuthInputProps) {
  const [options, setOptions] = useState<SelectOption[]>([])
  const { currencyConversions } = useI18n()
  const { t } = useTranslation()
  const currency = useCurrency()

  useEffect(() => {
    if (currencyConversions) {
      const intersection = Object.keys(DineroCurrencies)
        .filter((dineroCurrencyKey) =>
          Object.keys(currencyConversions).includes(dineroCurrencyKey)
        )
        .map((targetCurrency) => ({
          value: targetCurrency,
          label: targetCurrency,
        }))
      setOptions(intersection)
    }
  }, [currencyConversions]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FormField className={clsx({ [css.formField]: !className }, className)}>
      {options.length > 0 && (
        <Select
          name="currency"
          defaultValue={currency}
          error={error as string}
          disabled={disabled}
          label={showLabel ? t('forms:fields.currencies.label') : undefined}
          options={options}
          value={value}
          onChange={onChange}
          Icon={<CurrencyDollarIcon />}
        />
      )}
    </FormField>
  )
}

export function Email({ error }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <FormField className={css.formField}>
      <TextInput
        error={error as string}
        id="email"
        label={t('forms:fields.email.label')}
        minLength={8}
        name="email"
        type="email"
      />
    </FormField>
  )
}

export function Language({
  error,
  disabled,
  onChange,
  showLabel = true,
  value,
  className = '',
}: AuthInputProps) {
  const [options, setOptions] = useState<SelectOption[]>([])
  const { languages, getI18nInfo } = useI18n()
  const { t } = useTranslation()
  const language = useLanguage()

  useEffect(() => {
    const run = async () => {
      try {
        let i18nStateLanguages = languages
        if (!i18nStateLanguages) {
          const i18nInfo = await getI18nInfo()
          i18nStateLanguages = i18nInfo.languages
        }

        setOptions(
          i18nStateLanguages.map((language) => ({
            value: language.languages_code,
            label: language.label,
          }))
        )
      } catch {
        // if service fails, at least let them set English
        setOptions([
          {
            value: DEFAULT_LANG,
            label: t('common:global.language'),
          },
        ])
      }
    }
    run()
  }, [t, languages]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FormField className={clsx({ [css.formField]: !className }, className)}>
      {options.length > 0 && (
        <Select
          name="language"
          defaultValue={language}
          error={error as string}
          disabled={disabled}
          label={showLabel ? t('forms:fields.languages.label') : undefined}
          options={options}
          value={value}
          onChange={onChange}
          Icon={<GlobeAltIcon />}
        />
      )}
    </FormField>
  )
}
export function Username({ error }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <FormField className={css.formField}>
      <TextInput
        error={error as string}
        helpText={t('forms:fields.username.helpText')}
        id="username"
        label={t('forms:fields.username.label')}
        maxLength={20}
        minLength={4}
        name="username"
        type="text"
      />
    </FormField>
  )
}

export function Password({ error, helpLink }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <FormField className={css.formField}>
      <TextInput
        error={error as string}
        id="password"
        label={t('forms:fields.password.label')}
        minLength={8}
        name="password"
        type="password"
      />
      <div className={css.helpLink}>{helpLink ?? null}</div>
    </FormField>
  )
}

export interface ProfileImageProps extends AuthInputProps {
  handleProfilePicAccept(files: File[]): void
  handleProfilePicClear(): void
  handleProfilePicReject?(): void
  profilePic: FileWithPreview | null
  showHelpText?: boolean
  showLabel?: boolean
}

export function ProfileImage({
  handleProfilePicAccept,
  handleProfilePicClear,
  handleProfilePicReject,
  profilePic,
  showHelpText = true,
  showLabel = true,
}: ProfileImageProps) {
  const { t } = useTranslation()
  const [dropError, setDropError] = useState<boolean>(false)
  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    maxFiles: 1,
    maxSize: 1024 * 1024 * 2, // 2MB
    noDrag: true,
    onDropAccepted: (files: File[]) => {
      setDropError(false)
      handleProfilePicAccept(files)
    },
    onDropRejected: () => {
      handleProfilePicReject ? handleProfilePicReject() : setDropError(true)
    },
  })

  useEffect(
    () => () => {
      // /Revoke the data uris to avoid memory leaks
      profilePic && URL.revokeObjectURL(profilePic.preview)
    },
    [profilePic]
  )

  return (
    <FormField className={css.formField}>
      <label htmlFor="profileImage" className={css.labelContainer}>
        {showLabel && (
          <span className={css.label}>
            {t('forms:fields.profileImage.label')}
          </span>
        )}
        {dropError && (
          <span className={css.errorText}>
            {t('forms:errors.minImageFileSize', { fileSize: '2MB' })}
          </span>
        )}
        {!dropError && showHelpText && (
          <span className={css.helpText}>{t('common:statuses.Optional')}</span>
        )}
      </label>
      <div className={css.profileImageContainer}>
        <div className={css.avatarContainer}>
          {profilePic ? (
            <Image
              alt={t('common:nav.utility.My profile picture')}
              className={css.avatarWithImage}
              src={profilePic.preview}
              layout="responsive"
              height="100%"
              width="100%"
            />
          ) : (
            <UserCircleIcon className={css.avatarWithoutImage} />
          )}
        </div>
        <div className={css.profileImageActions}>
          {profilePic ? (
            <div className={css.profileImageChange}>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button size="small">{t('common:actions.Change')}</Button>
              </div>
              <Button
                className={css.profileImageRemove}
                onClick={() => {
                  setDropError(false)
                  handleProfilePicClear()
                }}
                size="small"
                variant="link"
              >
                {t('common:actions.Remove')}
              </Button>
            </div>
          ) : (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button size="small">{t('common:actions.Select Image')}</Button>
            </div>
          )}
        </div>
      </div>
    </FormField>
  )
}

export function Passphrase({ error }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <FormField className={css.formField}>
      <label htmlFor="passphrase" className={css.labelContainer}>
        <span className={css.label}>{t('forms:fields.passphrase.label')}</span>
        {!error && (
          <span className={css.helpText}>
            {t('forms:fields.passphrase.helpText')}
          </span>
        )}
        {error && <span className={css.errorText}>{error as string}</span>}
        <div className={css.passphraseInputWrapper}>
          <div className={css.passphraseInputFields}>
            <PassphraseInput error={error as string} id="passphrase" />
          </div>
          <div className={css.passphraseInputWarning}>
            <ShieldExclamationIcon className={css.passphraseInputShield} />
            {t('forms:fields.passphrase.warning')}
          </div>
        </div>
        <div className={css.passphraseInputDescription}>
          <p>{t('forms:fields.passphrase.description.1')}</p>
          <p>
            <u>{t('forms:fields.passphrase.description.2')}</u>
          </p>
        </div>
      </label>
    </FormField>
  )
}

export function Submit({ disabled }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <FormField>
      <Button disabled={disabled} fullWidth type="submit">
        {t('common:actions.Done')}
      </Button>
    </FormField>
  )
}
