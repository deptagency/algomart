import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@algomart/schemas'
import * as Currencies from '@dinero.js/currencies'
import {
  Currency,
  dinero,
  greaterThan,
  greaterThanOrEqual,
  toFormat,
  toUnit,
} from 'dinero.js'

export function dineroCurrency(code = DEFAULT_CURRENCY) {
  return Currencies[code as keyof typeof Currencies]
}

export function formatCredits(creditsInCents: number) {
  const credits = creditsInCents / 100
  if (Number.isNaN(credits)) return 0
  return formatCurrency(credits.toFixed(2))
}

export function formatCurrency(
  value?: string | number | null,
  locale = DEFAULT_LOCALE,
  code = DEFAULT_CURRENCY,
  conversionRate = 1
) {
  const currency = dineroCurrency(code)
  let amount = value
  if (amount === null || amount === undefined) {
    amount = 0
  } else if (typeof amount === 'string') {
    amount = Number.parseFloat(amount) * 100
  }

  amount = Math.round(amount * conversionRate)

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
      // Enforces $1.00 over US$1.00 in some locales
      // TODO: is this what we want?
      currencyDisplay: 'narrowSymbol',
    })
  }

  return toFormat(dinero({ amount, currency }), transformer)
}

export function formatToDecimal(
  amount: number,
  decimalPlaces: number,
  code = DEFAULT_CURRENCY,
  conversionRate = 1
) {
  const currency = dineroCurrency(code)
  const price = dinero({
    amount: amount * conversionRate,
    currency,
    scale: decimalPlaces,
  })
  return toUnit(price)
}

export function formatFloatToInt(
  float: number | string,
  code = DEFAULT_CURRENCY,
  conversionRate = 1
) {
  const currency = dineroCurrency(code)
  const number =
    typeof float === 'string'
      ? Number.parseFloat(float) * conversionRate
      : float * conversionRate
  const factor = currency.base ** currency.exponent
  const amount = Math.round(number * factor)
  const price = dinero({ amount, currency })
  return price.toJSON().amount
}

export function formatIntToFixed(
  amount: number,
  code = DEFAULT_CURRENCY,
  conversionRate = 1
) {
  amount = Math.round(amount * conversionRate)

  const currency = dineroCurrency(code)
  const price = dinero({ amount, currency })
  const formatted = toFormat(price, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return formatted
}

export function isGreaterThan(
  firstAmount: number,
  secondAmount: number,
  code = DEFAULT_CURRENCY
) {
  const currency = dineroCurrency(code)
  const price1 = dinero({ amount: firstAmount, currency })
  const price2 = dinero({ amount: secondAmount, currency })
  return greaterThan(price1, price2)
}

export function isGreaterThanOrEqual(
  firstAmount: number,
  secondAmount: number,
  code = DEFAULT_CURRENCY
) {
  const currency = dineroCurrency(code)
  const price1 = dinero({ amount: firstAmount, currency })
  const price2 = dinero({ amount: secondAmount, currency })
  return greaterThanOrEqual(price1, price2)
}
