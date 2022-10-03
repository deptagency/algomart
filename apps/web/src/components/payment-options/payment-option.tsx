import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './payment-option.module.css'

import AppLink from '@/components/app-link/app-link'
import { H2 } from '@/components/heading'

export interface PaymentOptionProps {
  body?: ReactNode | null
  helpText: string
  href: string | { pathname: string; query?: { [key: string]: string } }
  icon: ReactNode
  isDisabled?: boolean
  title: string
}

export default function PaymentOption({
  body,
  helpText,
  href,
  icon,
  isDisabled = false,
  title,
}: PaymentOptionProps) {
  return (
    <AppLink
      className={clsx(css.button, {
        [css.disabled]: isDisabled,
      })}
      href={href}
    >
      {icon}
      <div>
        <H2 inheritColor>{title}</H2>
        <p className={css.description}>{helpText}</p>
        {body && body}
      </div>
    </AppLink>
  )
}
