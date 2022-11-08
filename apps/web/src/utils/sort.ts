import { PaymentCards } from '@algomart/schemas'

import { getExpirationDate, isAfterDate } from '@/utils/date-time'

/**
 * Sort payment cards by expiration date
 */

export function sortByExpirationDate(
  cards: PaymentCards,
  sortDirection: 'asc' | 'desc' = 'desc'
) {
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

export function sortByDefault(cards: PaymentCards) {
  const defaultCards = cards.filter((c) => c.default === true)
  const otherCards = cards.filter((c) => c.default === false)
  return [...defaultCards, ...otherCards]
}

/**
 * returns a method to pass to Array.sort() to sort by a given property in an array of objects.
 */
export function getSorter(key: string, ignoreCase = false) {
  return (a, b) => {
    const valueA = ignoreCase ? a[key].toUpperCase() : a[key]
    const valueB = ignoreCase ? b[key].toUpperCase() : b[key]
    if (valueA < valueB) {
      return -1
    }
    if (valueA > valueB) {
      return 1
    }
    return 0
  }
}
