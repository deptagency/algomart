import Card, { CreditCardProps } from './credit-card'

import Heading from '@/components/heading'

export interface CreditCardsProps {
  cards: CreditCardProps[]
  header: string
}

/** A list of credit cards */
export default function CreditCards({ cards, header }: CreditCardsProps) {
  return (
    <>
      {header && (
        <Heading className="mb-10" level={1}>
          {header}
        </Heading>
      )}
      <ul>
        {cards.map(({ helpText, href, isDisabled, icon, title }) => (
          <li key={title}>
            <Card
              helpText={helpText}
              isDisabled={isDisabled}
              icon={icon}
              title={title}
              href={href}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
