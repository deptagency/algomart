import clsx from 'clsx'
import { ButtonHTMLAttributes, DetailedHTMLProps, HTMLAttributes } from 'react'
import css from './button.module.css'

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
  size = 'small',
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
        css.customButton,
        !disabled && variant === 'primary' ? css.primary : null,
        variant === 'secondary' ? css.secondary : null,
        variant === 'tertiary' ? css.tertiary : null,
        variant === 'link' ? css.link : null,
        {
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
