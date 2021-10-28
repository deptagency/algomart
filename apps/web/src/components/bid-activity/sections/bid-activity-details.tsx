import { ReactNode } from 'react'

import css from './bid-activity-details.module.css'

export interface BidActivityProps {
  amount: string | null
  content: string | null
  date: string
  children: ReactNode
}

export default function BidActivityDetails({
  amount,
  content,
  date,
  children,
}: BidActivityProps) {
  return (
    <li className={css.listItem}>
      <div className={css.firstColumn}>{children}</div>
      <div className={css.secondColumn}>
        <h2 className={css.heading}>{content}</h2>
        <p className={css.date}>{date}</p>
      </div>
      {amount && <p className={css.amount}>{amount}</p>}
    </li>
  )
}
