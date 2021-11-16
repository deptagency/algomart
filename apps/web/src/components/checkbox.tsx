import clsx from 'clsx'
import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

export default function Checkbox({
  checked,
  className,
  disabled,
  id,
  label,
  readOnly,
  ...props
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & { label: string }) {
  return (
    <>
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
        id={id}
        readOnly={readOnly}
        {...props}
      />
      {id && label && (
        <label className="pl-2" htmlFor={id}>
          {label}
        </label>
      )}
    </>
  )
}
