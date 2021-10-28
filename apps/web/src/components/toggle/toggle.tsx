import { Switch } from '@headlessui/react'
import clsx from 'clsx'
import { DetailedHTMLProps, InputHTMLAttributes, useState } from 'react'
import { useCallback, useEffect } from 'react'

import css from './toggle.module.css'

export interface ToggleProps
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    'onChange'
  > {
  error?: string
  helpText?: string
  onChange?: (checked: boolean) => void
  label: string
  styleMode?: 'light' | 'dark'
}

export default function Toggle({
  checked,
  disabled,
  error,
  helpText,
  id,
  label,
  onChange,
  styleMode,
}: ToggleProps) {
  const [enabled, setEnabled] = useState(checked || false)
  const handleChange = useCallback(
    (checked: boolean) => {
      setEnabled(checked)
      if (onChange) {
        onChange(checked)
      }
    },
    [onChange]
  )

  useEffect(() => {
    if (typeof checked === 'boolean') {
      setEnabled(checked)
    }
  }, [checked])

  return (
    <label htmlFor={id} className={css.labelContainer}>
      <Switch
        checked={enabled}
        onChange={handleChange}
        className={clsx(css.input, {
          [css.toggleEnabled]: enabled,
          [css.toggleNotEnabled]: !enabled,
          [css.inputDisabled]: disabled,
          [css.toggleLight]: styleMode !== 'dark',
          [css.toggleDark]: styleMode === 'dark',
        })}
        disabled={disabled}
      >
        <span className="sr-only">{label}</span>
        <span
          className={clsx(css.innerInput, {
            [css.innerInputEnabled]: enabled,
            [css.innerInputNotEnabled]: !enabled,
          })}
        />
      </Switch>
      {/* Used to capture value of checkbox */}
      <input
        className="sr-only"
        id={id}
        name={id}
        type="checkbox"
        checked={enabled}
        readOnly
      />
      <span className={css.label}>{label}</span>
      {error && <span className={css.errorText}>{error}</span>}
      {!error && helpText && <span className={css.helpText}>{helpText}</span>}
    </label>
  )
}
