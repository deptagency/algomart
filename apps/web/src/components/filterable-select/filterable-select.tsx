import { Combobox } from '@headlessui/react'
import { SelectorIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import useTranslation from 'next-translate/useTranslation'
import {
  DetailedHTMLProps,
  FunctionComponent,
  InputHTMLAttributes,
  useId,
  useMemo,
  useState,
} from 'react'

import css from './filterable-select.module.css'

import EllipsisLoader from '@/components/ellipsis-loader'
import FormField from '@/components/form-field'

export interface FilterableSelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FilterableSelectProps
  extends DetailedHTMLProps<
    Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange'>,
    HTMLSelectElement
  > {
  error?: string
  helpText?: string
  Icon?: FunctionComponent<Partial<{ className: string }>>
  label?: string
  noMargin?: boolean
  onChange?(value: string, selectedOption: FilterableSelectOption): void
  options?: FilterableSelectOption[]
  density?: 'compact' | 'normal'
  value?: string
  variant?: 'solid' | 'outline' | 'light'
  queryValue?: string
  onQueryChange?: (value: string) => void
  placeholder?: string
  isLoading?: boolean
  minCharactersForSuggestions?: number
}

export default function FilterableSelect({
  className,
  defaultValue,
  disabled,
  error,
  helpText,
  id,
  label,
  name,
  noMargin,
  onChange,
  options = [],
  placeholder,
  density = 'normal',
  value,
  variant = 'outline',
  queryValue,
  onQueryChange,
  isLoading,
  Icon = SelectorIcon,
  minCharactersForSuggestions = 0,
}: FilterableSelectProps) {
  const { t } = useTranslation()
  const defaultId = useId()
  id ||= defaultId
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? (options?.length ? options[0].value : '')
  )
  const [filter, setFilter] = useState('')
  const inputText = queryValue ?? filter

  const actualValue = value ?? internalValue
  const selectedOption = useMemo(() => {
    return value
      ? options.find((option) => option.value === value)
      : options.find((option) => option.value === internalValue)
  }, [options, internalValue, value])

  const handleChange = (value: string) => {
    if (onChange) {
      onChange(
        value,
        options.find((option) => option.value === value)
      )
    } else {
      setInternalValue(value)
    }
    setFilter('')
  }

  const handleFilterChange = ({ target }) => {
    if (queryValue !== undefined && onQueryChange) {
      // query text is controlled via props
      onQueryChange(target.value)
    } else {
      // query text stored internally
      setFilter(target.value)
    }
  }

  const filteredOptions = !inputText
    ? options
    : options.filter((option) =>
        option.label
          .toLowerCase()
          .trim()
          .includes(inputText.toLowerCase().trim())
      )

  const formFieldProps = {
    label,
    error,
    helpText,
    noMargin,
    density,
  }

  const renderOptions = () => {
    if (isLoading) {
      return (
        <li className={css.selectOption}>
          {t('common:statuses.Loading')}
          <EllipsisLoader inline />
        </li>
      )
    } else if (filteredOptions.length === 0) {
      return (
        <li className={css.selectOption}>{t('common:statuses.No results')}</li>
      )
    } else {
      return filteredOptions.map((option) => (
        <Combobox.Option
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
        </Combobox.Option>
      ))
    }
  }

  return (
    <FormField htmlFor={id} {...formFieldProps}>
      <div
        className={clsx(css.root, {
          [css.small]: density === 'compact',
          [css.solid]: variant === 'solid',
          [css.outline]: variant === 'outline',
          [css.light]: variant === 'light',
          [css.error]: error,
        })}
      >
        <Combobox
          disabled={disabled}
          onChange={handleChange}
          value={actualValue}
        >
          <div className={clsx(className, css.selectContainer)}>
            <Combobox.Input
              className={clsx(css.selectInput, {
                [css.disabled]: disabled,
              })}
              displayValue={(option) =>
                options.find((o) => o.value === option)?.label
              }
              onFocus={({ target }) => target.select()}
              value={inputText}
              onChange={handleFilterChange}
              placeholder={placeholder}
            />
            <Combobox.Button
              className={clsx(css.selectDropdown, {
                [css.disabled]: disabled,
              })}
            >
              <div className={css.iconContainer}>
                <Icon className={css.icon} />
              </div>
            </Combobox.Button>
            {inputText.length >= minCharactersForSuggestions && (
              <Combobox.Options className={css.selectOptions}>
                {renderOptions()}
              </Combobox.Options>
            )}
          </div>
        </Combobox>
        {/* Used to capture value of select */}
        <input
          tabIndex={-1}
          className="sr-only"
          readOnly
          value={selectedOption?.value}
          name={name}
          id={id}
        />
      </div>
    </FormField>
  )
}
