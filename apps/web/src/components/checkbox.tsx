import clsx from 'clsx'
import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

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
> & { label: string }) {
  return (
    <label>
      <input
        type="checkbox"
        className={clsx(
          'form-checkbox',
          {
            'bg-gray-200': readOnly || disabled,
          },
          className
        )}
        checked={checked}
        disabled={disabled}
        readOnly={readOnly}
        {...props}
      />
      {label && <span className="pl-2">{label}</span>}
    </label>
  )
}
