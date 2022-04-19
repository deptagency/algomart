import { formatCurrency, formatIntToFixed } from './currency'

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

  // formatIntToFixed
  test('formatIntToFixed', () => {
    const value = formatIntToFixed(1234, 'USD', 1)
    expect(value).toBe('12.34')
  })

  test('formatIntToFixed with conversionRate', () => {
    const value = formatIntToFixed(1234, 'USD', 2)
    expect(value).toBe('24.68')
  })

  test('formatIntToFixed for GBP with conversionRate', () => {
    const value = formatIntToFixed(1234, 'GBP', 0.75)
    expect(value).toBe('9.26')
  })
})
