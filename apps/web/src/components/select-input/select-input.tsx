import { Listbox } from '@headlessui/react'
import { SelectorIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { DetailedHTMLProps, InputHTMLAttributes, ReactNode } from 'react'

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
  fullWidth?: boolean
}

export default function Select({
  disabled,
  error,
  onChange,
  helpText,
  id,
  label,
  options,
  value,
  Icon,
}: SelectProps) {
  const _id = id ?? crypto.randomUUID()
  const selectedOption = options.find((option) => option.key === value)

  return (
    <label className={css.root} data-input="select" htmlFor={_id}>
      <div className={css.labelContainer}>
        {label && <div className={css.label}>{label}</div>}
        {error && <div className={css.errorText}>{error}</div>}
        {!error && helpText && <div className={css.helpText}>{helpText}</div>}
      </div>
      <Listbox disabled={disabled} onChange={onChange} value={value}>
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
        name={id}
        id={id}
      />
    </label>
  )
}
