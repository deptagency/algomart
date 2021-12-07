import clsx from 'clsx'
import { ReactNode } from 'react'

import css from './card.module.css'

import Heading from '@/components/heading'

export interface CardProps {
  handleClick: () => void
  helpText: string
  isDisabled: boolean
  icon: ReactNode
  title: string
}

export default function Card({
  handleClick,
  helpText,
  isDisabled,
  icon,
  title,
}: CardProps) {
  return (
    <section className={css.root}>
      <button
        onClick={handleClick}
        className={clsx(css.button, {
          [css.disabled]: isDisabled,
        })}
        disabled={isDisabled}
      >
        {icon}
        <div>
          <Heading level={2}>{title}</Heading>
          <p>{helpText}</p>
        </div>
      </button>
    </section>
  )
}
