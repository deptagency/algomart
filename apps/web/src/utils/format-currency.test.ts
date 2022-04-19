import {
  formatCurrency,
  formatIntToFloat,
  formatToDecimal,
} from './format-currency'

describe('Currency formatting utils', () => {
  // formatCurrency
  test('formatCurrency', () => {
    const value = formatCurrency(1234, 'en-US', 'USD', 1)
    expect(value).toBe('$12.34')
  })

  test('formatCurrency with conversionRate', () => {
    const value = formatCurrency(1234, 'en-US', 'USD', 2)
    expect(value).toBe('$24.68')
  })

  test('formatCurrency for GBP with conversionRate', () => {
    const value = formatCurrency(1234, 'en-US', 'GBP', 0.75)
    expect(value).toBe('£9.26')
  })

  // formatIntToFloat
  test('formatIntToFloat', () => {
    const value = formatIntToFloat(1234, 'USD', 1)
    expect(value).toBe('12.34')
  })

  test('formatIntToFloat with conversionRate', () => {
    const value = formatIntToFloat(1234, 'USD', 2)
    expect(value).toBe('24.68')
  })

  test('formatIntToFloat for GBP with conversionRate', () => {
    const value = formatIntToFloat(1234, 'GBP', 0.75)
    expect(value).toBe('9.26')
  })

  // formatToDecimal
  test('formatToDecimal', () => {
    expect(formatToDecimal(1234, 0)).toBe(1234)
    expect(formatToDecimal(1234, 2)).toBe(12.34)
    expect(formatToDecimal(1234, 4)).toBe(0.1234)
  })

  test('formatToDecimal with conversion rate', () => {
    // TND actually uses 3 decimal places so I don't know
    // what the point of passing a currency code is.
    expect(formatToDecimal(100, 2, 'TND', 2)).toBe(2)
  })
})
