import { USD } from '@dinero.js/currencies'
import {
  add,
  convert,
  dinero,
  greaterThan,
  greaterThanOrEqual,
  toFormat,
} from 'dinero.js'

import { Configuration } from '@/configuration'

export const currency = Configuration.currency

export function formatFloatToInt(float: number) {
  const factor = currency.base ** currency.exponent
  const amount = Math.round(float * factor)
  const price = dinero({ amount, currency })
  return price.toJSON().amount
}

export function formatIntToFloat(amount: number) {
  const price = dinero({ amount, currency })
  const float = toFormat(price, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return Number(float)
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

function getAmountAndScale(exchangeRate: string) {
  // rates from Coinbase may sometimes be expressed as `2.3524410751737836e-05`
  // therefore we need to use parseFloat here to parse it correctly
  // Number.parseFloat('2.3524410751737836e-05').toString()
  //   => '0.000023524410751737836'
  const [whole, fraction] = Number.parseFloat(exchangeRate)
    .toString()
    .split('.')
  const scale = fraction ? fraction.length : 0
  const amount = Number.parseInt(whole + fraction, 10)
  return { amount, scale }
}

export function convertFromUSD(
  amount: number,
  rateForNonUSD: { [key: string]: string }
) {
  if (!rateForNonUSD[currency.code]) return null
  const rates = { [currency.code]: getAmountAndScale(rateForNonUSD.USD) }
  const price = dinero({ amount, currency: USD })
  const finalPrice = currency === USD ? price : convert(price, currency, rates)
  const float = toFormat(finalPrice, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return float
}

export function convertToUSD(
  amount: number,
  rateForUSD: { [key: string]: string }
) {
  if (!rateForUSD.USD) return null
  const rates = { USD: getAmountAndScale(rateForUSD.USD) }
  const price = dinero({ amount, currency })
  const priceUSD = currency === USD ? price : convert(price, USD, rates)
  const float = toFormat(priceUSD, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return float
}
