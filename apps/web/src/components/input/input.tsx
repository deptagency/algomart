import clsx from 'clsx'
import {
  ChangeEventHandler,
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactNode,
  useCallback,
} from 'react'

import css from './input.module.css'

type DomProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'onChange'
>

export interface InputProps extends DomProps {
  startAdornment?: string | ReactNode
  density?: 'compact' | 'normal'
  endAdornment?: string | ReactNode
  hasError?: boolean
  inputClassName?: string
  onChange?: (value: string) => void
  variant?: 'light' | 'dark'
}

export default function Input({
  className,
  density = 'normal',
  disabled,
  endAdornment,
  hasError,
  inputClassName,
  onChange,
  readOnly,
  startAdornment,
  variant = 'dark',
  ...rest
}: InputProps) {
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      event.preventDefault()
      if (onChange) {
        onChange(event.target.value)
      }
    },
    [onChange]
  )

  return (
    <div
      className={clsx(css.container, {
        [css.compact]: density === 'compact',
        [css.readOnly]: readOnly,
        [css.disabled]: disabled,
        [css.inputError]: hasError,
        [css.inputValid]: !hasError,
        [css.light]: variant === 'light',
      })}
    >
      {startAdornment ? (
        <div className={css.adornment}>{startAdornment}</div>
      ) : null}
      <input
        className={clsx(css.input, inputClassName)}
        disabled={disabled}
        onChange={handleChange}
        readOnly={readOnly}
        {...rest}
      />
      {endAdornment ? (
        <div className={css.adornment}>{endAdornment}</div>
      ) : null}
    </div>
  )
}
