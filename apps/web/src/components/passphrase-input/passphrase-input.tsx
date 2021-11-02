import clsx from 'clsx'
import { useState } from 'react'
import ReactCodeInput from 'react-verification-code-input'

import css from './passphrase-input.module.css'

export interface PassphraseInputProps {
  error?: string
  fields?: number
  handleChange?: (value: string) => void
  helpText?: string
  id?: string
  label?: string
  loading?: boolean
  type?: 'number' | 'text'
  value?: string
}

export default function PassphraseInput({
  error,
  fields = 6,
  handleChange,
  helpText,
  id,
  label,
  loading = false,
  value = '',
  type = 'text',
  ...props
}: PassphraseInputProps) {
  const [inputValue, setInputValue] = useState<string>(value)
  const inputField = (
    <>
      <ReactCodeInput
        className={clsx(css.passphraseInput, {
          [css.passphraseInputError]: error,
        })}
        fields={fields}
        loading={loading}
        onChange={(value_: string) => {
          setInputValue(value_)
          handleChange && handleChange(value_)
        }}
        values={value ? [...value] : []}
        type={type}
        {...props}
      />
      {/* Used to capture value of passphrase input */}
      <input id={id} name={id} type="hidden" value={inputValue} />
    </>
  )
  return label ? (
    <label htmlFor={id} className={css.labelContainer}>
      <span className={css.label}>{label}</span>
      {error && <span className={css.errorText}>{error as string}</span>}
      {!error && helpText && <span className={css.helpText}>{helpText}</span>}
      {inputField}
    </label>
  ) : (
    inputField
  )
}
