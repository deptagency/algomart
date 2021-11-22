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
        'w-full font-poppins bg-gray-900 border-2 border-gray-600 rounded-lg placeholder-gray-400 text-gray-50 focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-gray-900 px-3 py-2',
        {
          [css.inputDisabled]: readOnly || disabled,
          [css.inputError]: error,
          ['border-gray-600']: !error,
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
    <label htmlFor={id} className="block text-sm font-medium text-gray-50">
      <span
        className={clsx('w-1/2', {
          ['text-sm']: variant === 'small',
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
