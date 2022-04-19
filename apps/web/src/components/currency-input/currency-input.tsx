import clsx from 'clsx'
import { useState } from 'react'
import CurrencyInputField, {
  CurrencyInputProps as CurrencyInputFieldProps,
} from 'react-currency-input-field'

// Styles are 1:1 with text input
import css from '../text-input/text-input.module.css'

import { useI18n } from '@/contexts/i18n-context'
import { useCurrency } from '@/hooks/use-currency'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency, formatIntToFixed } from '@/utils/format-currency'

export interface CurrencyInputProps
  extends Omit<CurrencyInputFieldProps, 'value' | 'onChange'> {
  error?: string
  value: number
  onChange: (value: number) => void
  helpText?: string
  label?: string
  variant?: 'small' | 'medium'
}

export default function CurrencyInput({
  className,
  disabled,
  error,
  onChange,
  onBlur,
  helpText,
  id,
  label,
  readOnly,
  variant = 'medium',
  value,
  ...props
}: CurrencyInputProps) {
  const { conversionRate } = useI18n()
  const currency = useCurrency()
  const locale = useLocale()
  const [stringValue, setStringValue] = useState(String(value / 100))

  const handleChange = (value: string) => {
    if (value === undefined || Number.isNaN(Number(value))) {
      setStringValue('0')
      onChange(0)
    } else {
      setStringValue(value)
      onChange(Math.round(Number(value) * 100))
    }
  }

  const handleBlur = (event_) => {
    setStringValue(formatIntToFixed(value))
    if (onBlur) onBlur(event_)
  }

  const localizedValue = formatCurrency(value, locale, currency, conversionRate)

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
      onValueChange={handleChange}
      disabled={disabled}
      id={id}
      min={0}
      max={100_000_000_000}
      readOnly={readOnly}
      value={stringValue}
      step={1}
      intlConfig={{ locale: 'en-US', currency: 'USD' }}
      onBlur={handleBlur}
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
      <div className={css.contentTop}>
        <span className={css.label}>{label}</span>
        {error && <span className={css.errorText}>{error}</span>}
        {!error && (helpText || localizedValue) && (
          <span className={css.helpText}>{helpText || localizedValue}</span>
        )}
      </div>
      {inputField}
    </label>
  ) : (
    inputField
  )
}
