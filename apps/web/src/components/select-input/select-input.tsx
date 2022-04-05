import { Listbox } from '@headlessui/react'
import { SelectorIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import {
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactNode,
  useMemo,
  useState,
} from 'react'

import css from './select.module.css'

export interface SelectOption {
  key: string
  label: string | ReactNode
  disabled?: boolean
}

export interface SelectProps
  extends DetailedHTMLProps<
    Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange'>,
    HTMLSelectElement
  > {
  error?: string
  onChange?(value: string): void
  helpText?: string
  label?: string
  options: SelectOption[]
  value?: string
  Icon?: ReactNode
}

export default function Select({
  defaultValue,
  disabled,
  error,
  onChange,
  helpText,
  id,
  name,
  label,
  options,
  value,
  Icon,
}: SelectProps) {
  const _id = id ?? crypto.randomUUID()
  const [internalValue, setInternalValue] = useState(
    defaultValue || options[0].key
  )

  const actualValue = value ?? internalValue
  const selectedOption = useMemo(() => {
    return value
      ? options.find((option) => option.key === value)
      : options.find((option) => option.key === internalValue)
  }, [options, internalValue, value])

  const handleChange = (value: string) => {
    if (onChange) {
      onChange(value)
    } else {
      setInternalValue(value)
    }
  }

  return (
    <label className={css.root} data-input="select" htmlFor={_id}>
      <div className={css.labelContainer}>
        {label && <div className={css.label}>{label}</div>}
        {error && <div className={css.errorText}>{error}</div>}
        {!error && helpText && <div className={css.helpText}>{helpText}</div>}
      </div>
      <Listbox disabled={disabled} onChange={handleChange} value={actualValue}>
        <div className={css.selectContainer}>
          <Listbox.Button
            className={clsx(css.selectButton, {
              [css.selectButtonDisabled]: disabled,
              [css.selectButtonError]: error,
            })}
          >
            <div className={css.selectButtonText}>
              {Icon}
              {selectedOption.label}
            </div>
            <div className={css.selectButtonIconContainer}>
              <SelectorIcon
                className={css.selectButtonIcon}
                aria-hidden="true"
              />
            </div>
          </Listbox.Button>

          <Listbox.Options className={css.selectOptions}>
            {options.map((option) => (
              <Listbox.Option
                disabled={option.disabled}
                className={({ active, selected }) =>
                  clsx(css.selectOption, {
                    [css.selectOptionActive]: active,
                    [css.selectOptionSelected]: selected,
                    [css.selectOptionDisabled]: option.disabled,
                  })
                }
                key={option.key}
                value={option.key}
              >
                {option.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
      {/* Used to capture value of select */}
      <input
        className="sr-only"
        readOnly
        value={selectedOption.key}
        name={name}
        id={id}
      />
    </label>
  )
}
