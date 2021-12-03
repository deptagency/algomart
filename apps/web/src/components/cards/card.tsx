import { ReactNode } from 'react'

import css from './card.module.css'

import Heading from '@/components/heading'

export interface CardProps {
  handleClick: () => void
  helpText: string
  icon: ReactNode
  title: string
}

export default function Card({
  handleClick,
  helpText,
  icon,
  title,
}: CardProps) {
  return (
    <section className={css.root}>
      <button onClick={handleClick}>
        {icon}
        <Heading level={2}>{title}</Heading>
        <p>{helpText}</p>
      </button>
    </section>
  )
}
