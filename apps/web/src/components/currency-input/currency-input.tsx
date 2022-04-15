import clsx from 'clsx'
import CurrencyInputField, {
  CurrencyInputProps as CurrencyInputFieldProps,
} from 'react-currency-input-field'

// Styles are 1:1 with text input
import css from '../text-input/text-input.module.css'

export interface CurrencyInputProps
  extends Omit<CurrencyInputFieldProps, 'onChange'> {
  error?: string
  onChange?: (value: string) => void
  helpText?: string
  label?: string
  variant?: 'small' | 'medium'
}

export default function CurrencyInput({
  className,
  disabled,
  error,
  onChange,
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
        if (onChange) {
          if (value === undefined || Number.isNaN(Number(value))) {
            return onChange('0')
          }
          return onChange(value)
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
    <label
      htmlFor={id}
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
