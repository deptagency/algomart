import { useId } from 'react'

import FormField, { FormFieldProps } from '@/components/form-field'
import Input, { InputProps } from '@/components/input'

export type InputFieldProps = FormFieldProps &
  InputProps & {
    inputClassName?: string
  }

/**
 * An Input wrapped in a FormField.
 */
export default function InputField({
  className,
  error,
  errorVariant,
  helpText,
  id,
  inputClassName,
  label,
  noMargin,
  density,
  ...rest
}: InputFieldProps) {
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

  const inputProps = {
    className: inputClassName,
    hasError: !!error,
    id,
    density,
    ...rest,
  }

  return (
    <FormField {...fieldProps}>
      <Input {...inputProps} />
    </FormField>
  )
}
