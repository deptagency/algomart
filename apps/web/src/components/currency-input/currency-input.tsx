import { DEFAULT_CURRENCY } from '@algomart/schemas'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import { ReactNode, useEffect, useState } from 'react'
import CurrencyInputField, {
  CurrencyInputProps as CurrencyInputFieldProps,
} from 'react-currency-input-field'

// Styles are 1:1 with input
import css from '@/components/input/input.module.css'

import FormField, { FormFieldProps } from '@/components/form-field'
import Tooltip from '@/components/tooltip'
import { useCurrency } from '@/contexts/currency-context'
import { useI18n } from '@/contexts/i18n-context'
import { useLocale } from '@/hooks/use-locale'
import { formatCurrency, formatIntToFixed } from '@/utils/currency'

export interface CurrencyInputProps
  extends Omit<CurrencyInputFieldProps, 'value' | 'onChange'> {
  credits?: boolean
  startAdornment?: ReactNode | string
  endAdornment?: ReactNode | string
  hideSymbol?: boolean
  showLocalizedValue?: boolean
  onChange?: (value: number) => void
  prefix?: string
  value: number
  density?: 'compact' | 'normal'
  variant?: 'light' | 'dark'
}

export default function CurrencyInput({
  credits,
  className,
  disabled,
  error,
  errorVariant,
  helpText,
  endAdornment,
  id,
  label,
  showLocalizedValue = true,
  noMargin,
  onChange,
  onBlur,
  onFocus,
  prefix,
  readOnly,
  size,
  startAdornment,
  suffix,
  density = 'normal',
  value,
  variant = 'dark',
  ...props
}: CurrencyInputProps & FormFieldProps) {
  const { t } = useTranslation()
  const { conversionRate } = useI18n()
  const { currency } = useCurrency()
  const locale = useLocale()
  const [stringValue, setStringValue] = useState(String(value / 100))

  useEffect(() => {
    if (stringValue !== String(value / 100)) {
      setStringValue(String(value / 100))
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (value: string) => {
    if (!onChange) return
    if (value === undefined || Number.isNaN(Number(value))) {
      setStringValue('0')
      onChange(0)
    } else {
      setStringValue(value)
      onChange(Math.round(Number(value) * 100))
    }
  }

  const handleFocus = (event) => {
    /**
     * This addresses the situation where an empty value converts to 0.00
     * and focusing the field after that conversion puts the cursor after 0.00,
     * which does not allow the user to enter a value
     */
    if (value === 0) {
      setStringValue('')
    }
    if (onFocus) onFocus(event)
  }

  const handleBlur = (event) => {
    setStringValue(formatIntToFixed(value))
    if (onBlur) onBlur(event)
  }

  const localizedValue =
    currency !== DEFAULT_CURRENCY
      ? formatCurrency(value, locale, currency, conversionRate)
      : undefined

  endAdornment ||= localizedValue ? (
    <Tooltip content={t('common:tips.currencyEstimate')}>
      {localizedValue}
    </Tooltip>
  ) : undefined

  const inputField = (
    <div
      className={clsx(
        css.container,
        {
          [css.compact]: density === 'compact',
          [css.readOnly]: readOnly,
          [css.disabled]: disabled,
          [css.inputError]: error,
          [css.inputValid]: !error,
          [css.light]: variant === 'light',
        },
        className
      )}
    >
      {startAdornment ? (
        <div className={css.adornment}>{startAdornment}</div>
      ) : null}
      <CurrencyInputField
        className={clsx(css.input, className)}
        onValueChange={handleChange}
        disabled={disabled}
        id={id}
        min={0}
        max={100_000_000_000}
        readOnly={readOnly}
        value={stringValue}
        step={1}
        intlConfig={
          credits ? undefined : { locale: locale, currency: DEFAULT_CURRENCY }
        }
        onFocus={handleFocus}
        onBlur={handleBlur}
        prefix={prefix}
        suffix={suffix}
        {...props}
      />
      {endAdornment ? (
        <div className={css.adornment}>{endAdornment}</div>
      ) : null}
    </div>
  )

  const formFieldProps = {
    density,
    error,
    errorVariant,
    helpText,
    label,
    noMargin,
    size,
  }

  return label ? (
    <FormField {...formFieldProps}>{inputField}</FormField>
  ) : (
    inputField
  )
}
