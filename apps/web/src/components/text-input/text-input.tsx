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
      id={id}
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
    <label htmlFor={id} className={css.labelContainer}>
      <span
        className={clsx(css.label, {
          [css.labelSmall]: variant === 'small',
        })}
      >
        {label}
      </span>
      {error && (
        <span
          className={clsx(css.errorText, {
            [css.errorTextSmall]: variant === 'small',
          })}
        >
          {error}
        </span>
      )}
      {!error && helpText && (
        <span
          className={clsx(css.helpText, {
            [css.helpTextSmall]: variant === 'small',
          })}
        >
          {helpText}
        </span>
      )}
      {inputField}
    </label>
  ) : (
    inputField
  )
}
