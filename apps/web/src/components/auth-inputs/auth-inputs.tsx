import { DEFAULT_LANG } from '@algomart/schemas'
import * as DineroCurrencies from '@dinero.js/currencies'
import { UserCircleIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'
import { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import css from './auth-inputs.module.css'

import Button, { ButtonProps } from '@/components/button'
import FilterableSelect, {
  FilterableSelectOption,
  FilterableSelectProps,
} from '@/components/filterable-select'
import FormField, { FormFieldProps } from '@/components/form-field'
import InputField, { InputFieldProps } from '@/components/input-field'
import SelectField, {
  SelectFieldProps,
  SelectOption,
} from '@/components/select-field'
import { useCurrency } from '@/contexts/currency-context'
import { useI18n } from '@/contexts/i18n-context'
import { useLanguage } from '@/contexts/language-context'
import { FileWithPreview } from '@/types/file'

/**
 * Reused components found throughout sign-in, sign-up, and profile create/update flows
 */

type AuthSelectProps = Omit<SelectFieldProps, 'options' | 'error'> & {
  error?: string | unknown
}
type AuthFilterableSelectProps = Omit<
  FilterableSelectProps,
  'options' | 'error'
> & { error?: string | unknown }
type AuthInputProps = Omit<InputFieldProps, 'error'> & {
  error?: string | unknown
}

export function Currency({ error, ...props }: AuthFilterableSelectProps) {
  const [options, setOptions] = useState<FilterableSelectOption[]>([])
  const { currencyConversions } = useI18n()
  const { t } = useTranslation()
  const { currency } = useCurrency()

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

  if (options.length === 0) return null

  return (
    <FilterableSelect
      defaultValue={currency}
      error={error as string}
      label={t('forms:fields.currencies.label')}
      name="currency"
      options={options}
      variant="light"
      {...props}
    />
  )
}

export function Age({ error, ...props }: AuthFilterableSelectProps) {
  const { t } = useTranslation()
  const naOption = {
    label: t('forms:fields.age.options.N/A'),
    value: '',
  }
  const options: FilterableSelectOption[] = [
    ...(!props.value ? [naOption] : []),
    ...Array.from({ length: 100 })
      .map((_, index) => ({
        label: index + 1 + '',
        value: index + 1 + '',
      }))
      .slice(13),
  ]

  if (options.length === 0) return null

  return (
    <FilterableSelect
      defaultValue={options[0].value}
      error={error as string}
      label={t('forms:fields.age.label')}
      name="age"
      options={options}
      variant="light"
      {...props}
    />
  )
}

export function Email({ error, ...props }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <InputField
      error={error as string}
      id="email"
      label={t('forms:fields.email.label')}
      name="email"
      variant="light"
      {...props}
    />
  )
}

export function Language({ error, ...props }: AuthSelectProps) {
  const { languages } = useI18n()
  const { t } = useTranslation()
  const { language } = useLanguage()
  const options = useMemo<SelectOption[]>(() => {
    if (languages.length === 0) {
      return [
        {
          value: DEFAULT_LANG,
          label: t('common:global.language'),
        },
      ]
    }

    return languages.map((language) => ({
      value: language.languages_code,
      label: language.label,
    }))
  }, [languages, t])

  return (
    <SelectField
      error={error as string}
      defaultValue={language}
      label={t('forms:fields.languages.label')}
      name="language"
      options={options}
      variant="light"
      {...props}
    />
  )
}

export function Username({ error, ...props }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <InputField
      error={error as string}
      helpText={
        props.label !== '' ? t('forms:fields.username.helpText') : undefined
      }
      // Poppins "@" sits low on baseline and needs a little help
      startAdornment={<div className="-mt-px">@</div>}
      id="username"
      label={t('forms:fields.username.label')}
      maxLength={20}
      name="username"
      type="text"
      {...props}
    />
  )
}

export function Password({ error, ...props }: AuthInputProps) {
  const { t } = useTranslation()
  return (
    <InputField
      id="password"
      label={t('forms:fields.password.label')}
      helpText={t('forms:fields.password.helpText')}
      name="password"
      type="password"
      error={error as string}
      {...props}
    />
  )
}

export interface ProfileImageProps {
  handleProfilePicAccept(files: File[]): void
  handleProfilePicClear(): void
  handleProfilePicReject?(): void
  noPad?: boolean
  profilePic: FileWithPreview | null
  showHelpText?: boolean
  variant?: 'light' | 'dark'
}

export function ProfileImage({
  handleProfilePicAccept,
  handleProfilePicClear,
  handleProfilePicReject,
  noPad,
  profilePic,
  showHelpText = true,
  variant = 'dark',
  ...rest
}: FormFieldProps & ProfileImageProps) {
  const { t } = useTranslation()
  const [dropError, setDropError] = useState(false)
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
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
    <FormField
      htmlFor="profileImage"
      label={t('forms:fields.profileImage.label')}
      error={
        dropError && t('forms:errors.minImageFileSize', { fileSize: '2MB' })
      }
      helpText={showHelpText ? t('common:statuses.Optional') : null}
      {...rest}
    >
      <div
        className={clsx(css.profileImageContainer, {
          [css.light]: variant === 'light',
          [css.noPad]: noPad,
        })}
      >
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
                <Button>{t('common:actions.Change')}</Button>
              </div>
              <Button
                onClick={() => {
                  setDropError(false)
                  handleProfilePicClear()
                }}
                variant="link"
              >
                {t('common:actions.Remove')}
              </Button>
            </div>
          ) : (
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button>{t('common:actions.Select Image')}</Button>
            </div>
          )}
        </div>
      </div>
    </FormField>
  )
}

export function Submit({
  translationKey = 'forms:Submit',
  ...rest
}: ButtonProps & { translationKey?: string }) {
  const { t } = useTranslation()

  return (
    <Button fullWidth type="submit" {...rest}>
      {t(translationKey)}
    </Button>
  )
}
