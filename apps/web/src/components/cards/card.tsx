import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './card.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'

export interface CardProps {
  handleClick?: () => void
  helpText: string
  href: string
  icon: ReactNode
  isDisabled: boolean
  title: string
}

export default function Card({
  handleClick,
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
        onClick={handleClick}
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
