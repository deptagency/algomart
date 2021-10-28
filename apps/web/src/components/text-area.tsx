import clsx from 'clsx'
import { ChangeEvent, DetailedHTMLProps, TextareaHTMLAttributes } from 'react'

interface TextAreaProps {
  handleChange?: (value: string) => void
}

export default function TextArea({
  className,
  handleChange,
  readOnly,
  disabled,
  ...props
}: TextAreaProps &
  DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >) {
  return (
    <textarea
      className={clsx(
        'border w-full block border-solid border-base-gray-border p-3 shadow-medium rounded-md focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 font-light',

        {
          'bg-gray-200': readOnly || disabled,
        },
        className
      )}
      disabled={disabled}
      onChange={(event: ChangeEvent & { target: { value: string } }) => {
        event.preventDefault()
        if (event && event.target && handleChange) {
          handleChange(event.target.value)
        }
      }}
      readOnly={readOnly}
      {...props}
    />
  )
}
