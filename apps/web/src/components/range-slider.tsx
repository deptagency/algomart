import clsx from 'clsx'
import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from 'react'

interface RangeSliderProps {
  handleChange?: (value: string) => void
}

export default function RangeSlider({
  className,
  disabled,
  handleChange,
  id,
  max,
  min,
  step,
  readOnly,
  value,
  ...props
}: RangeSliderProps &
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) {
  return (
    <input
      type="range"
      className={clsx(
        'px-3 py-2 border border-gray-200 rounded w-full text-center',
        {
          'bg-gray-200': readOnly || disabled,
        },
        className
      )}
      disabled={disabled}
      id={id}
      max={max}
      min={min}
      onChange={(event: ChangeEvent & { target: { value: string } }) => {
        event.preventDefault()
        if (event && event.target && handleChange) {
          handleChange(event.target.value)
        }
      }}
      step={step}
      value={value}
      readOnly={readOnly}
      {...props}
    />
  )
}
