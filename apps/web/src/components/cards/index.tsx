import { ReactNode } from 'react'

import Card from './card'

export interface CardProps {
  cards: {
    handleClick: () => void
    helpText: string
    icon: ReactNode
    method: string
    title: string
  }[]
}

export default function Cards({ cards }: CardProps) {
  return (
    <ul>
      {cards.map(({ handleClick, helpText, icon, method, title }) => (
        <li key={method}>
          <Card
            handleClick={handleClick}
            helpText={helpText}
            icon={icon}
            title={title}
          />
        </li>
      ))}
    </ul>
  )
}
