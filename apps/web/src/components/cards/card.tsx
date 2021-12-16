import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './card.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'

export interface CardProps {
  helpText: string
  href: string
  icon: ReactNode
  isDisabled: boolean
  title: string
}

export default function Card({
  helpText,
  href,
  icon,
  isDisabled,
  title,
}: CardProps) {
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
