import { RadioInput } from '@/components/radio-input/radio-input'
import { SelectOption } from '@/components/select'

export interface RadioGroupProps {
  className?: string
  disabled?: boolean
  hasError?: boolean
  helpText?: string
  inline?: boolean
  label?: string
  name: string
  onBlur?: (value: string, event: InputEvent) => void
  onChange?: (value: string, event: InputEvent) => void
  onFocus?: (value: string, event: InputEvent) => void
  options: SelectOption[]
  value?: string
}

function handleEvent(options, callback) {
  if (!callback) return null
  return (index, event) => callback(options[index].value, event)
}

/**
A collection of radio inputs. Use in place of a `<Select>` when the number
of options is small.
*/
export default function RadioGroup({
  value,
  hasError,
  options,
  onChange,
  onBlur,
  onFocus,
  className,
  disabled,
  name,
  inline,
}: RadioGroupProps) {
  return (
    <div className={className}>
      {options.map((option, index) => (
        <RadioInput
          key={index}
          aria-invalid={hasError}
          checked={value === option.value}
          inline={inline}
          disabled={disabled || option.disabled}
          name={name}
          onBlur={handleEvent(options, onBlur)}
          onChange={handleEvent(options, onChange)}
          onFocus={handleEvent(options, onFocus)}
          value={index}
        >
          {option.label}
        </RadioInput>
      ))}
    </div>
  )
}
