import { useId } from 'react'

import FormField, { FormFieldProps } from '@/components/form-field'
import Select, { SelectProps } from '@/components/select'

export type SelectFieldProps = FormFieldProps &
  SelectProps & {
    inputClassName?: string
  }

/**
 * A Select wrapped in a FormField.
 */
export default function SelectField({
  className,
  error,
  errorVariant,
  helpText,
  id,
  inputClassName,
  label,
  noMargin,
  variant,
  density,
  ...rest
}: SelectFieldProps) {
  const defaultId = useId()
  id ||= defaultId

  const fieldProps = {
    className,
    error,
    errorVariant,
    helpText,
    htmlFor: id,
    label,
    noMargin,
    density,
  }

  const selectProps = {
    className: inputClassName,
    hasError: !!error,
    id,
    variant,
    density,
    ...rest,
  }

  return (
    <FormField {...fieldProps}>
      <Select {...selectProps} />
    </FormField>
  )
}
