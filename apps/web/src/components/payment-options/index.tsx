import PaymentOption, { PaymentOptionProps } from './payment-option'

export interface PaymentOptionsProps {
  cards: PaymentOptionProps[]
}

export default function PaymentOptions({ cards }: PaymentOptionsProps) {
  return (
    <ul>
      {cards.map(({ body, helpText, href, isDisabled, icon, title }) => (
        <li key={title}>
          <PaymentOption
            body={body}
            helpText={helpText}
            isDisabled={isDisabled}
            icon={icon}
            title={title}
            href={href}
          />
        </li>
      ))}
    </ul>
  )
}
