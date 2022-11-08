import clsx from 'clsx'
import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

import css from './radio-input.module.css'

export interface RadioInputProps
  extends DetailedHTMLProps<
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'onChange' | 'onBlur' | 'onFocus'
    >,
    HTMLInputElement
  > {
  onChange?(value: string, event: InputEvent): void
  onBlur?(value: string, event: InputEvent): void
  onFocus?(value: string, event: InputEvent): void
  inline?: boolean
}

function handleEvent(value, callback) {
  if (!callback) return
  return (event) => callback(value, event)
}

/**
`<RadioInput>` is used by `<RadioGroup>` to render individual inputs. It may
be also be used by itself to create radio groups with custom-rendered content.
*/
export function RadioInput({
  checked,
  children,
  className,
  disabled,
  inline,
  name,
  onBlur,
  onChange,
  onFocus,
  style,
  value,
  ...rest
}: RadioInputProps) {
  return (
    <label
      className={clsx(className, css.radioInput, {
        [css.inline]: inline,
        [css.disabled]: disabled,
        [css.selected]: checked,
      })}
      style={style}
    >
      <div className={css.bullet}>
        <div />
      </div>
      <input
        checked={checked}
        className={css.input}
        disabled={disabled}
        name={name}
        onBlur={handleEvent(value, onBlur)}
        onChange={handleEvent(value, onChange)}
        onFocus={handleEvent(value, onFocus)}
        type="radio"
        value={value}
        {...rest}
      />
      <div className={css.labelText}>{children}</div>
    </label>
  )
}
