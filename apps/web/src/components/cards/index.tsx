import Card, { CardProps } from './card'

import Heading from '@/components/heading'

export interface CardsProps {
  cards: CardProps[]
  header: string
}

export default function Cards({ cards, header }: CardsProps) {
  return (
    <>
      {header && (
        <Heading className="mb-10" level={1}>
          {header}
        </Heading>
      )}
      <ul>
        {cards.map(
          ({ handleClick, helpText, href, isDisabled, icon, title }) => (
            <li key={href}>
              <Card
                helpText={helpText}
                isDisabled={isDisabled}
                icon={icon}
                title={title}
                handleClick={handleClick}
                href={href}
              />
            </li>
          )
        )}
      </ul>
    </>
  )
}
