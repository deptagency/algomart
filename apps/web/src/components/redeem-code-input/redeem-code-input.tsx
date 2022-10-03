import clsx from 'clsx'
import ReactCodeInput from 'react-verification-code-input'

import css from './redeem-code-input.module.css'

export interface RedeemCodeInputProps {
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

export default function RedeemCodeInput({
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
}: RedeemCodeInputProps) {
  const inputField = (
    <>
      <ReactCodeInput
        className={clsx(css.redeemCodeInput, {
          [css.redeemCodeInputError]: error,
        })}
        fields={fields}
        loading={loading}
        onChange={(value_: string) => {
          handleChange && handleChange(value_)
        }}
        values={value ? [...value] : []}
        type={type}
        {...props}
      />
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
