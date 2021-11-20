import clsx from 'clsx'
import { ButtonHTMLAttributes, DetailedHTMLProps, HTMLAttributes } from 'react'

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
        'duration-300 rounded-sm transition',
        {
          'px-4 py-3 border border-transparent font-semibold text-sm rounded-full shadow-sm text-gray-50 hover:cursor-pointer focus:outline-none bg-blue-600 hover:bg-blue-400 active:shadow-inner active:bg-blue-800 font-poppins disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed':
            !disabled && variant === 'primary',
          'p-3.5 border-2 border-gray-600 hover:bg-gray-900 rounded-full font-medium text-gray-400 disabled:cursor-not-allowed':
            variant === 'secondary',
          'bg-transparent border-none text-base-gray-dark hover:border-none':
            variant === 'tertiary',
          'bg-transparent border-none text-base-gray-dark float-left mb-5':
            variant === 'link',
          'font-bold text-xl': size === 'medium',
          'px-10 py-5': size === 'medium' && !disablePadding,
          'px-6 py-2': size === 'small' && !disablePadding,
          'bg-gray-400 cursor-not-allowed text-white focus:ring-secondary opacity-30':
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
