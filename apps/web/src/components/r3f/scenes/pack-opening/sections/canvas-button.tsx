import clsx from 'clsx'
import { ButtonHTMLAttributes, DetailedHTMLProps, HTMLAttributes } from 'react'

import css from './canvas-button.module.css'

interface ButtonProps {
  visible: boolean
}

export default function Button({
  children,
  onClick,
  visible,
}: ButtonProps &
  DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> &
  DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >) {
  return (
    <button
      className={clsx(css.root, {
        [css.invisible]: !visible,
      })}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}
