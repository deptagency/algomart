import clsx from 'clsx'
import { ButtonHTMLAttributes, DetailedHTMLProps, HTMLAttributes } from 'react'

import { useThemeContext } from '@/contexts/theme-context'

export interface ButtonProps {
  disablePadding?: boolean
  size?: 'small' | 'medium'
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link'
  fullWidth?: boolean
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
}: ButtonProps &
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
  DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >) {
  return (
    <button
      className={clsx(
        'duration-300 rounded-sm transition text-base-primaryText',
        {
          'bg-base-actionPrimary border-none shadow-large hover:bg-opacity-90 text-base-actionContrastText':
            !disabled && variant === 'primary',
          'bg-white shadow-large hover:bg-opacity-90 dark:text-gray-900':
            variant === 'secondary',
          'bg-transparent border-none hover:border-none':
            variant === 'tertiary',
          'bg-transparent border-none float-left mb-5': variant === 'link',
          'font-bold text-xl': size === 'medium',
          'px-10 py-5': size === 'medium' && !disablePadding,
          'px-6 py-2': size === 'small' && !disablePadding,
          'bg-gray-400 cursor-not-allowed focus:ring-secondary opacity-30':
            disabled,
          'block w-full': fullWidth,
        },
        className
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
