import clsx from 'clsx'
import { DetailedHTMLProps, InputHTMLAttributes, ReactNode } from 'react'

import css from './checkbox.module.css'

export default function Checkbox({
  checked,
  className,
  disabled,
  label,
  readOnly,
  ...props
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & { label: ReactNode | string }) {
  return (
    <label className={clsx(className, css.root)}>
      <input
        type="checkbox"
        className={css.input}
        checked={checked}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
      {label && (
        <span className={clsx(css.label, { [css.labelDisabled]: disabled })}>
          {label}
        </span>
      )}
    </label>
  )
}
