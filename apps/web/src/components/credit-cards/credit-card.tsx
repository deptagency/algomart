import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './card.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'

export interface CreditCardProps {
  helpText: string
  href: string | { pathname: string; query?: { [key: string]: string } }
  icon: ReactNode
  isDisabled: boolean
  title: string
}

/** A credit card */
export default function CreditCard({
  helpText,
  href,
  icon,
  isDisabled,
  title,
}: CreditCardProps) {
  return (
    <section className={css.root}>
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
        </div>
      </AppLink>
    </section>
  )
}
