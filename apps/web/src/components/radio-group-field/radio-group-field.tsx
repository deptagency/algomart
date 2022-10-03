import FormField, { FormFieldProps } from '@/components/form-field'
import RadioGroup, { RadioGroupProps } from '@/components/radio-group'

export type RadioGroupFieldProps = FormFieldProps &
  RadioGroupProps & {
    radioGroupClassName?: string
  }

/**
 * An Input wrapped in a FormField.
 */
export default function RadioGroupField({
  className,
  error,
  errorVariant,
  helpText,
  radioGroupClassName,
  label,
  noMargin,
  density,
  ...rest
}: RadioGroupFieldProps) {
  const fieldProps = {
    className,
    error,
    errorVariant,
    helpText,
    label,
    noMargin,
    density,
  }

  const radioGroupProps = {
    className: radioGroupClassName,
    hasError: !!error,
    ...rest,
  }

  return (
    <FormField component="fieldset" {...fieldProps}>
      <RadioGroup {...radioGroupProps} />
    </FormField>
  )
}
