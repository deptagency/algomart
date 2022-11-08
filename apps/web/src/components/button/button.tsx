import clsx from 'clsx'
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  HTMLAttributes,
  JSXElementConstructor,
} from 'react'

import css from './button.module.css'

import EllipsisLoader from '@/components/ellipsis-loader'

export interface ButtonBaseProps {
  busy?: boolean
  disablePadding?: boolean
  as?: string
  size?: 'small' | 'large'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'accent'
  fullWidth?: boolean
  group?: boolean
}

export type ButtonProps = ButtonBaseProps &
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

export function buttonClasses(
  props: ButtonBaseProps & { disabled?: boolean; className?: string }
) {
  const {
    busy,
    disablePadding,
    size,
    variant,
    fullWidth,
    disabled,
    className,
  } = props
  return clsx(
    css.button,
    {
      [css.primary]: variant === 'primary',
      [css.secondary]: variant === 'secondary',
      [css.outline]: variant === 'outline',
      [css.accent]: variant === 'accent',
      [css.ghost]: variant === 'ghost',
      [css.link]: variant === 'link',
      [css.large]: size === 'large',
      [css.small]: size === 'small',
      [css.disabled]: disabled,
      [css.fullWidth]: fullWidth,
      [css.disablePadding]: disablePadding,
      [css.busy]: busy,
    },
    className
  )
}

export default function Button({
  busy,
  as: component = 'button',
  children,
  className,
  disabled = false,
  disablePadding = false,
  onClick,
  fullWidth,
  size = 'small',
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  const Component = component as unknown as JSXElementConstructor<
    Record<string, unknown>
  >

  return (
    <Component
      className={buttonClasses({
        busy,
        className,
        disablePadding,
        disabled,
        size,
        fullWidth,
        variant,
      })}
      disabled={disabled || busy}
      onClick={onClick}
      type={component === 'button' ? type : undefined}
      {...props}
    >
      <span className={css.textWrapper}>{children}</span>
      {busy && <EllipsisLoader className={css.loader} />}
    </Component>
  )
}
