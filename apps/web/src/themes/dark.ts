import base from './light'
import { extendTheme } from './utils'

export default extendTheme(base, {
  themeType: 'dark',

  textPrimary: 'rgba(255, 255, 255, 1)',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textTertiary: 'rgba(255, 255, 255, 0.625)',
  textDisabled: 'rgba(255, 255, 255, 0.3)',

  bg: '#222327',
  bgCard: '#080c0d',

  actionPrimary: 'hotpink',

  grayDark: '#f4eeea',
  border: '#666',
  nav: 'red',

  error: '#AC0000', // errorRed
  action: '#12DCC5', // teal
  actionAccent: '#02FBC2', // green
  price: '#33C500', // priceGreen
})
