import { Listbox } from '@headlessui/react'
import { SelectorIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import {
  DetailedHTMLProps,
  InputHTMLAttributes,
  ReactNode,
  useState,
} from 'react'

import css from './select.module.css'

export interface SelectOption {
  id: string
  label: string | ReactNode
}

export interface SelectProps
  extends DetailedHTMLProps<
    InputHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > {
  defaultOption?: SelectOption
  error?: string
  handleChange?(option: SelectOption): void
  helpText?: string
  label?: string
  options: SelectOption[]
  selectedValue?: SelectOption | null
}

export default function Select({
  defaultOption,
  disabled,
  error,
  handleChange,
  helpText,
  id,
  label,
  options,
  selectedValue,
}: SelectProps) {
  const [selected, setSelected] = useState(defaultOption || options[0])
  const value = selectedValue || selected

  const onChange = (option: SelectOption) => {
    if (handleChange) {
      handleChange(option)
    } else {
      setSelected(option)
    }
  }

  return (
    <label className={css.root} data-input="select" htmlFor={id}>
      <div className={css.labelContainer}>
        {label && <span className={css.label}>{label}</span>}
        {error && <span className={css.errorText}>{error}</span>}
        {!error && helpText && <span className={css.helpText}>{helpText}</span>}
      </div>
      <Listbox disabled={disabled} onChange={onChange} value={value}>
        <div className={css.selectContainer}>
          <Listbox.Button
            className={clsx(css.selectButton, {
              [css.selectButtonDisabled]: disabled,
              [css.selectButtonError]: error,
            })}
          >
            <span className={css.selectButtonText}>{value.label}</span>
            <span className={css.selectButtonIconContainer}>
              <SelectorIcon
                className={css.selectButtonIcon}
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Listbox.Options className={css.selectOptions}>
            {options.map((option) => (
              <Listbox.Option
                className={({ active, selected }) =>
                  clsx(css.selectOption, {
                    [css.selectOptionActive]: active,
                    [css.selectOptionSelected]: selected,
                  })
                }
                key={option.id}
                value={option}
              >
                <span>{option.label}</span>
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </div>
      </Listbox>
      {/* Used to capture value of select */}
      <input
        className="sr-only"
        id={id}
        name={id}
        readOnly
        value={selected.id}
      />
    </label>
  )
}
