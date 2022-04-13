import { formatCurrency,formatIntToFloat } from './format-currency'

describe('Currency formatting utils', () => {
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
})
