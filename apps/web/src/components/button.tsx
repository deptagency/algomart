import clsx from 'clsx'
import { ButtonHTMLAttributes, DetailedHTMLProps, HTMLAttributes } from 'react'

import { useThemeContext } from '@/contexts/theme-context'

export interface ButtonBaseProps {
  disablePadding?: boolean
  size?: 'small' | 'medium'
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link'
  fullWidth?: boolean
}

export type ButtonProps = ButtonBaseProps &
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

export function buttonClasses(
  props: ButtonBaseProps & { disabled?: boolean; className?: string }
) {
  const { disablePadding, size, variant, fullWidth, disabled, className } =
    props
  return clsx(
    'duration-300 rounded-sm transition text-base-primaryText',
    {
      'bg-action-primary border-none shadow-large hover:bg-opacity-90 text-action-primaryContrastText':
        !disabled && variant === 'primary',
      // TODO: secondary variant should map to bg-action-secondary
      'bg-white shadow-large hover:bg-opacity-90 dark:text-gray-900':
        variant === 'secondary',
      // TODO: This should be a "ghost" variant
      'bg-transparent border-none hover:border-none': variant === 'tertiary',
      'bg-transparent border-none float-left mb-5': variant === 'link',
      'font-bold text-xl': size === 'medium',
      'px-10 py-5': size === 'medium' && !disablePadding,
      'px-6 py-2': size === 'small' && !disablePadding,
      'bg-gray-400 cursor-not-allowed pointer-events-none focus:ring-secondary opacity-30':
        disabled,
      'block w-full': fullWidth,
    },
    className
  )
}

export default function Button({
  children,
  className,
  disabled = false,
  disablePadding = false,
  onClick,
  size = 'medium',
  fullWidth,
  variant = 'primary',
  type = 'button',
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
      })}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
