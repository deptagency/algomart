import clsx from 'clsx'
import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from 'react'

import css from './text-input.module.css'

interface TextInputProps {
  error?: string
  handleChange?: (value: string) => void
  helpText?: string
  label?: string
  variant?: 'small' | 'medium'
}

export default function TextInput({
  className,
  disabled,
  error,
  handleChange,
  helpText,
  id,
  label,
  readOnly,
  variant = 'medium',
  ...props
}: TextInputProps &
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) {
  const _id = id ?? crypto.randomUUID()
  const inputField = (
    <input
      className={clsx(
        css.input,
        {
          [css.inputDisabled]: readOnly || disabled,
          [css.inputError]: error,
          [css.inputValid]: !error,
          [css.inputMedium]: variant === 'medium',
          [css.inputSmall]: variant === 'small',
        },
        className
      )}
      disabled={disabled}
      id={_id}
      onChange={(event: ChangeEvent & { target: { value: string } }) => {
        event.preventDefault()
        if (event && event.target && handleChange) {
          handleChange(event.target.value)
        }
      }}
      readOnly={readOnly}
      {...props}
    />
  )
  return label ? (
    <label
      htmlFor={_id}
      className={clsx(css.labelContainer, {
        [css.small]: variant === 'small',
      })}
    >
      <span className={css.label}>{label}</span>
      {error && <span className={css.errorText}>{error}</span>}
      {!error && helpText && <span className={css.helpText}>{helpText}</span>}
      {inputField}
    </label>
  ) : (
    inputField
  )
}
