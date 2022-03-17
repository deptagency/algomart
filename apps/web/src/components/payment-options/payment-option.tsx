import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './payment-option.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'

export interface PaymentOptionProps {
  body?: ReactNode | null
  helpText: string
  href: string | { pathname: string; query?: { [key: string]: string } }
  icon: ReactNode
  isDisabled: boolean
  title: string
}

export default function PaymentOption({
  body,
  helpText,
  href,
  icon,
  isDisabled,
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
        <Heading level={2}>{title}</Heading>
        <p>{helpText}</p>
        {body && body}
      </div>
    </AppLink>
  )
}
