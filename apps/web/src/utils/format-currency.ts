import { DEFAULT_LOCALE } from '@algomart/schemas'
import {
  add,
  Currency,
  dinero,
  greaterThan,
  greaterThanOrEqual,
  toFormat,
} from 'dinero.js'

import { Environment } from '@/environment'

const currency: Currency<number> = Environment.currency

export function formatCurrency(
  value?: string | number | null,
  locale = DEFAULT_LOCALE
) {
  let amount = value
  if (amount === null || amount === undefined) {
    amount = 0
  } else if (typeof amount === 'string') {
    amount = Number.parseFloat(amount) * 100
  }

  function transformer({
    amount,
    currency,
  }: {
    amount: number
    currency: Currency<number>
  }) {
    return amount.toLocaleString(locale, {
      style: 'currency',
      currency: currency.code,
    })
  }

  return toFormat(dinero({ amount, currency }), transformer)
}

export function formatFloatToInt(float: number | string) {
  const number = typeof float === 'string' ? Number.parseFloat(float) : float
  const factor = currency.base ** currency.exponent
  const amount = Math.round(number * factor)
  const price = dinero({ amount, currency })
  return price.toJSON().amount
}

export function formatIntToFloat(amount: number) {
  const price = dinero({ amount, currency })
  const float = toFormat(price, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return float
}

export function addAmount(originalAmount: number, newAmount: number) {
  const price1 = dinero({ amount: originalAmount, currency })
  const price2 = dinero({ amount: newAmount, currency })
  return add(price1, price2)
}

export function isGreaterThan(firstAmount: number, secondAmount: number) {
  const price1 = dinero({ amount: firstAmount, currency })
  const price2 = dinero({ amount: secondAmount, currency })
  return greaterThan(price1, price2)
}

export function isGreaterThanOrEqual(
  firstAmount: number,
  secondAmount: number
) {
  const price1 = dinero({ amount: firstAmount, currency })
  const price2 = dinero({ amount: secondAmount, currency })
  return greaterThanOrEqual(price1, price2)
}
