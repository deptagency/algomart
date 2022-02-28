import clsx from 'clsx'
import { ButtonHTMLAttributes, DetailedHTMLProps, HTMLAttributes } from 'react'

import EllipsisLoader from '@/components/ellipsis-loader'

export interface ButtonBaseProps {
  busy?: boolean
  disablePadding?: boolean
  size?: 'small' | 'medium'
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link'
  fullWidth?: boolean
  group?: 'left' | 'right' | 'middle'
  rounded?: boolean
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
    rounded = true,
    group,
  } = props
  return clsx(
    'duration-300 transition text-base-primaryText font-normal relative',
    {
      'rounded-sm': !group,
      'rounded-l-sm': group === 'left',
      'rounded-r-sm': group === 'right',
      'bg-action-primary tracking-wide font-bold border-none shadow-large hover:bg-opacity-90 text-action-primaryContrastText':
        !disabled && variant === 'primary',
      'bg-action-secondary tracking-wide font-display text-action-secondaryContrastText shadow-large hover:bg-opacity-90':
        variant === 'secondary',
      // TODO: This should be a "ghost" variant
      'bg-transparent border-none hover:border-none': variant === 'tertiary',
      'bg-transparent border-none float-left mb-5': variant === 'link',
      'text-base': size === 'small',
      'text-lg': size === 'medium',
      'px-10 py-5': size === 'medium' && !disablePadding,
      'px-10 py-3': size === 'small' && !disablePadding,
      'bg-gray-400 cursor-not-allowed pointer-events-none focus:ring-secondary opacity-30':
        disabled,
      'block w-full': fullWidth,
      'rounded-full': rounded,
    },
    className
  )
}

export default function Button({
  busy,
  children,
  className,
  disabled = false,
  disablePadding = false,
  onClick,
  fullWidth,
  size = 'small',
  variant = 'primary',
  type = 'button',
  group,
  rounded,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({
        className,
        disablePadding,
        disabled,
        size,
        fullWidth,
        variant,
        group,
        rounded,
      })}
      disabled={disabled || busy}
      onClick={onClick}
      type={type}
      {...props}
    >
      <span className={busy && 'opacity-0'}>{children}</span>
      {busy && (
        <EllipsisLoader className="absolute bottom-0 left-0 right-0 -mt-4 top-1/2" />
      )}
    </button>
  )
}
