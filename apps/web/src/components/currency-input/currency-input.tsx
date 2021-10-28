import clsx from 'clsx'
import CurrencyInputField, {
  CurrencyInputProps as CurrencyInputFieldProps,
} from 'react-currency-input-field'

// Styles are 1:1 with text input
import css from '../text-input/text-input.module.css'

export interface CurrencyInputProps extends CurrencyInputFieldProps {
  error?: string
  handleChange?: (value: string) => void
  helpText?: string
  label?: string
  variant?: 'small' | 'medium'
}

export default function CurrencyInput({
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
}: CurrencyInputProps) {
  const inputField = (
    <CurrencyInputField
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
      onValueChange={(value) => {
        if (handleChange) {
          if (value === undefined || Number.isNaN(Number(value))) {
            return handleChange('0')
          }
          return handleChange(value)
        }
      }}
      disabled={disabled}
      id={id}
      max={100_000_000_000}
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
