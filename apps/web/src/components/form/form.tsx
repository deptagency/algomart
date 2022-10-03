import {
  DetailedHTMLProps,
  FormEventHandler,
  FormHTMLAttributes,
  ReactNode,
  useCallback,
  useState,
} from 'react'
import { ValidatorTest } from 'validator-fns'

import { toJSON } from '@/utils/form-to-json'

export interface FormProps<T>
  extends Omit<
    DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>,
    'noValidate' | 'onSubmit' | 'children'
  > {
  onSubmit(data: T): void
  validate?: ValidatorTest<T>
  children(params: {
    errors: Record<string, string>
    values: Record<string, unknown>
    hasErrors: boolean
  }): ReactNode
  initialValues?: Partial<T>
}

export function Form<T>({
  children,
  onSubmit,
  initialValues,
  validate,
  ...props
}: FormProps<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [values, setValues] = useState<Partial<T>>(initialValues ?? {})
  const hasErrors = Object.keys(errors).length > 0

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    async (event) => {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const data = toJSON<T>(formData)

      if (validate) {
        const result = await validate(data)
        if (result.state === 'valid') {
          setValues(result.value)
          onSubmit(result.value)
        } else {
          setErrors(result.errors)
        }
      } else {
        setValues(data)
        onSubmit(data)
      }
    },
    [onSubmit, validate]
  )

  return (
    <form {...props} noValidate onSubmit={handleSubmit}>
      {children({ errors, values, hasErrors })}
    </form>
  )
}
