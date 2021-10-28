import { PaymentCards } from '@algomart/schemas'

import { getExpirationDate, isAfterDate } from '@/utils/date-time'

/**
 * Sort payment cards by expiration date
 */

export const sortByExpirationDate = (
  cards: PaymentCards,
  sortDirection: 'asc' | 'desc' = 'desc'
) => {
  return cards.sort((firstCard, secondCard) => {
    const expiration1 = getExpirationDate(
      firstCard.expirationMonth as string,
      firstCard.expirationYear as string
    )
    const expiration2 = getExpirationDate(
      secondCard.expirationMonth as string,
      secondCard.expirationYear as string
    )
    if (expiration1 === expiration2) {
      return 0
    }
    if (isAfterDate(expiration1, expiration2)) {
      return sortDirection === 'desc' ? -1 : 1
    } else {
      return sortDirection === 'desc' ? 1 : -1
    }
  })
}

/**
 * Sort by default cards
 */

export const sortByDefault = (cards: PaymentCards) => {
  const defaultCards = cards.filter((c) => c.default === true)
  const otherCards = cards.filter((c) => c.default === false)
  return [...defaultCards, ...otherCards]
}
