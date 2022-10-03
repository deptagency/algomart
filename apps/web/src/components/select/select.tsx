import { Listbox } from '@headlessui/react'
import { SelectorIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import React, {
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactNode,
  useMemo,
  useState,
} from 'react'

import css from './select.module.css'

export interface SelectOption {
  value: string
  label: string | ReactNode
  disabled?: boolean
}

export interface SelectProps
  extends DetailedHTMLProps<
    Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange' | 'size'>,
    HTMLSelectElement
  > {
  hasError?: boolean
  Icon?: ReactNode
  onChange?(value: string): void
  options: SelectOption[]
  density?: 'compact' | 'normal'
  value?: string
  variant?: 'solid' | 'outline' | 'light'
}

export default function Select({
  className,
  defaultValue,
  disabled,
  hasError,
  Icon,
  id,
  name,
  onChange,
  options,
  density = 'normal',
  value,
  variant = 'outline',
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? (options?.length ? options[0].value : '')
  )

  const actualValue = value ?? internalValue
  const selectedOption = useMemo(() => {
    return value
      ? options.find((option) => option.value === value)
      : options.find((option) => option.value === internalValue)
  }, [options, internalValue, value])

  const handleChange = (value: string) => {
    if (onChange) {
      onChange(value)
    } else {
      setInternalValue(value)
    }
  }

  return (
    <div
      className={clsx(css.root, className, {
        [css.compact]: density === 'compact',
        [css.solid]: variant === 'solid',
        [css.outline]: variant === 'outline',
        [css.light]: variant === 'light',
        [css.error]: hasError,
      })}
    >
      <Listbox disabled={disabled} onChange={handleChange} value={actualValue}>
        <span className={css.selectContainer}>
          <Listbox.Button
            className={clsx(css.selectButton, {
              [css.disabled]: disabled,
            })}
          >
            <span className={css.selectButtonText}>
              {Icon}
              {selectedOption?.label ?? '—'}
            </span>
            <span className={css.iconContainer}>
              <SelectorIcon className={css.icon} aria-hidden="true" />
            </span>
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
                key={option.value}
                value={option.value}
              >
                {option.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </span>
      </Listbox>
      {/* Used to capture value of select */}
      <input
        tabIndex={-1}
        className="sr-only"
        readOnly
        value={actualValue}
        name={name}
        id={id}
      />
    </div>
  )
}
