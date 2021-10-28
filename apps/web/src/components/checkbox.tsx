import clsx from 'clsx'
import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

export default function Checkbox({
  className,
  disabled,
  id,
  name,
  readOnly,
  value,
  ...props
}: DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={clsx(
        'form-checkbox',
        {
          'bg-gray-200': readOnly || disabled,
        },
        className
      )}
      disabled={disabled}
      id={id}
      name={name}
      readOnly={readOnly}
      value={value}
      {...props}
    />
  )
}
