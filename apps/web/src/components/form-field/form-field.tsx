/* eslint-disable jsx-a11y/label-has-associated-control */
import clsx from 'clsx'
import {
  DetailedHTMLProps,
  FieldsetHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
} from 'react'

import css from './form-field.module.css'

export interface FormFieldProps {
  component?: 'label' | 'fieldset'
  error?: string
  errorVariant?: 'full-width'
  helpText?: string | ReactNode
  label?: string
  density?: 'compact' | 'normal'
  children?: ReactNode
  noMargin?: boolean
}

type LabelProps = DetailedHTMLProps<
  LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>
type FieldSetProps = DetailedHTMLProps<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  HTMLFieldSetElement
>

export default function FormField({
  component = 'label',
  className,
  label,
  error,
  errorVariant = 'full-width',
  helpText,
  children,
  density,
  noMargin,
  ...rest
}: FormFieldProps & LabelProps & FieldSetProps) {
  const Component = component
  const isErrorFullWidth = errorVariant === 'full-width'

  return (
    <Component
      className={clsx(css.labelContainer, className, {
        [css.compact]: density === 'compact',
        [css.noMargin]: noMargin,
      })}
      {...rest}
    >
      {label || error || helpText ? (
        <div className={css.contentTop}>
          {component === 'label' ? (
            <span className={css.labelText}>{label}</span>
          ) : (
            <label className={css.labelText}>{label}</label>
          )}
          {error && !isErrorFullWidth && (
            <span className={css.errorText}>{error}</span>
          )}
          {(!error || isErrorFullWidth) && helpText && (
            <span className={css.helpText}>{helpText}</span>
          )}
        </div>
      ) : null}
      {error && isErrorFullWidth && (
        <div className={css.fullWidthError}>{error}</div>
      )}
      {children}
    </Component>
  )
}
