import { calculator } from '@dinero.js/calculator-bigint'
import * as Currencies from '@dinero.js/currencies'
import { USD } from '@dinero.js/currencies'
import {
  add,
  convert,
  dinero,
  greaterThan,
  greaterThanOrEqual,
  toFormat,
} from 'dinero.js'

const BASIS_POINTS = 10_000n
const DEFAULT_PRECISION = 1000n

// Ensure we always round up to the nearest evenly divisible value based on the precision
function roundUp(amount: bigint, precision = DEFAULT_PRECISION) {
  return amount + (precision - (amount % precision))
}

// NOTE: Circle charges a flat $0.30 transaction fee + 2.9% + additional 1.0% border fee if non-US.
export function calculateCreditCardFees(
  amountInCents: bigint | number,
  countryCode = 'US',
  precision = DEFAULT_PRECISION
) {
  if (typeof amountInCents !== 'bigint') amountInCents = BigInt(amountInCents)
  const feeInBasisPoints = countryCode === 'US' ? 290n : 390n

  const amountWithPrecision = amountInCents * precision
  const centFeeWithPrecision = 30n * precision
  const percentFeeWithPrecision =
    (feeInBasisPoints * amountWithPrecision) / BASIS_POINTS

  const initialFee = percentFeeWithPrecision + centFeeWithPrecision

  // Because these fees are based off of the total amount sent to Circle, we also need to
  // calculate a delta of how much additional fee needs to be paid to cover the total processing fee
  // so that the user ends up with the exact amount of credits they've opted to purchase.
  const deltaFee = (initialFee * feeInBasisPoints) / BASIS_POINTS

  const totalFees = roundUp(initialFee + deltaFee, precision) / precision

  return {
    amountN: amountInCents,
    feesN: totalFees,
    totalN: amountInCents + totalFees,
  }
}

export function formatFloatToInt(
  float: number | string,
  currency: Currencies.Currency<number>
) {
  const number = typeof float === 'string' ? Number.parseFloat(float) : float
  const factor = currency.base ** currency.exponent
  const amount = Math.round(number * factor)
  const price = dinero({ amount, currency })
  return price.toJSON().amount
}

export function formatIntToFixed(
  amount: number,
  currency: Currencies.Currency<number>
) {
  const price = dinero({ amount, currency })
  const float = toFormat(price, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return Number(float)
}

export function formatBigIntToUSDFixed(amount: bigint) {
  const base = USD.base
  const exp = USD.exponent
  const dollars = calculator.integerDivide(amount, BigInt(base ** exp))
  const cents = calculator.modulo(amount, BigInt(base ** exp))
  return `${dollars}.${cents.toString().padStart(exp, '0')}`
}

export function convertUSDFixedToBigInt(amountFixed: string) {
  const base = USD.base
  const exp = USD.exponent
  const [dollars, cents = '00'] = amountFixed.split('.')
  const amount = BigInt(dollars) * BigInt(base ** exp) + BigInt(cents)
  return amount
}

export function addAmount(
  originalAmount: number,
  newAmount: number,
  currency: Currencies.Currency<number>
) {
  const price1 = dinero({ amount: originalAmount, currency })
  const price2 = dinero({ amount: newAmount, currency })
  return add(price1, price2)
}

export function isGreaterThan(
  firstAmount: number,
  secondAmount: number,
  currency: Currencies.Currency<number>
) {
  const price1 = dinero({ amount: firstAmount, currency })
  const price2 = dinero({ amount: secondAmount, currency })
  return greaterThan(price1, price2)
}

export function isGreaterThanOrEqual(
  firstAmount: number,
  secondAmount: number,
  currency: Currencies.Currency<number>
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
  usdFloat: string | number,
  rateForNonUSD: { [key: string]: string },
  currency: Currencies.Currency<number>
) {
  if (!rateForNonUSD[currency.code]) return null
  const rates = { [currency.code]: getAmountAndScale(rateForNonUSD.USD) }
  const usdFloatNumber =
    typeof usdFloat === 'string' ? Number.parseFloat(usdFloat) : usdFloat
  const amount = formatFloatToInt(usdFloatNumber, currency)
  const price = dinero({ amount, currency: USD })
  const finalPrice = currency === USD ? price : convert(price, currency, rates)
  const float = toFormat(finalPrice, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return float
}

export function convertToUSD(
  amount: number,
  rateForUSD: { [key: string]: string },
  currency: Currencies.Currency<number>
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
