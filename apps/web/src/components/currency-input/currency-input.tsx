import { DEFAULT_CURRENCY } from '@algomart/schemas'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import CurrencyInputField, {
  CurrencyInputProps as CurrencyInputFieldProps,
} from 'react-currency-input-field'

// Styles are 1:1 with text input
import css from '@/components/text-input/text-input.module.css'

import { useCurrency } from '@/contexts/currency-context'
import { useI18n } from '@/contexts/i18n-context'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency, formatIntToFixed } from '@/utils/currency'

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
  const { currency } = useCurrency()
  const locale = useLocale()
  const [stringValue, setStringValue] = useState(String(value / 100))
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    /*
     * This addresses an issue where the user's selected currency is not
     * available at hydration time, causing a discrepancy between server and client
     */
    setHydrated(true)
  }, [])

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

  const localizedValue =
    currency !== DEFAULT_CURRENCY
      ? formatCurrency(value, locale, currency, conversionRate)
      : undefined

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
      intlConfig={{ locale: locale, currency: DEFAULT_CURRENCY }}
      onBlur={handleBlur}
      {...props}
    />
  )
  return label && hydrated ? (
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
