import * as Currencies from '@dinero.js/currencies'
import { defineDisplay, useApi as directusApi } from '@directus/extensions-sdk'
import { Currency, dinero, toFormat } from 'dinero.js'

function formatIntToFloat(amount: number, currency: Currency<number>) {
  const price = dinero({ amount, currency })
  const float = toFormat(price, ({ amount, currency }) =>
    amount.toFixed(currency.exponent)
  )
  return float
}

// Price conversion from integer to float
function readPrice(price: number, currency: Currency<number>): string {
  try {
    const decimal = formatIntToFloat(price, currency)
    return decimal
  } catch (error) {
    throw new Error(error)
  }
}

export default defineDisplay({
  id: 'price',
  name: 'Price',
  description: 'Change price from integer to float when displayed around app.',
  icon: 'attach_money',
  component: ({ value }) => {
    const api = directusApi()
    const data = { currency: Currencies.USD }
    api.get('/items/application').then((app) => {
      if (app.data.data.currency)
        data.currency = Currencies[app.data.data.currency]
    })
    const newValue = value ? readPrice(value, data.currency) : null
    return newValue
  },
  types: ['integer'],
  options: null,
})
