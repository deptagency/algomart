/* eslint-disable @typescript-eslint/no-var-requires */
const flattenColorPalette =
  require('tailwindcss/lib/util/flattenColorPalette').default
const plugin = require('tailwindcss/plugin')

module.exports = {
  // Keep JIT disabled for now. Enabling it will break the custom font loading.
  // mode: 'jit',
  purge: {
    // tree-shaking unused styles
    content: [
      './src/components/**/*.{js,ts,jsx,tsx,css}',
      './src/layouts/**/*.{js,ts,jsx,tsx,css}',
      './src/pages/**/*.{js,ts,jsx,tsx,css}',
      './src/templates/**/*.{js,ts,jsx,tsx,css}',
    ],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      backgroundImage: {
        'pack-texture': "url('/images/textures/pack-texture.jpg')",
      },
      borderRadius: {
        sm: '4px',
      },
      borderWidth: {
        1: '1px',
        6: '6px',
        20: '20px',
      },
      boxShadow: {
        medium: '0px 1px 10px rgba(0, 0, 0, 0.15)',
        large: '0px 5px 40px rgba(0, 0, 0, 0.15)',
      },
      colors: {
        base: {
          errorRed: '#AC0000',
          green: '#02FBC2',
          priceGreen: '#33C500',
          teal: '#12DCC5',
          gray: {
            dark: '#0A111D',
            text: '#4B4F56',
            nav: '#808080',
            notice: '#F9F8F9',
            medium: '#747F8F',
            light: '#B6BECB',
            border: '#DADCDF',
            bg: '#ECECEC',
          },
        },
      },
      height: {
        thumb: '100px',
      },
      margin: {
        15: '3.55rem',
      },
      minHeight: {
        thumb: '80px',
      },
      minWidth: {
        checkout: '520px',
        700: '700px',
        880: '880px',
      },
      maxWidth: {
        520: '520px',
        700: '700px',
        880: '880px',
        wrapper: '1100px',
      },
      width: {
        250: '250px',
        xxs: '150px',
        '2/3': '66.666667%',
        '80p': '80%',
        '70p': '70%',
        thumb: '100px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    // Enables specifying border colors per-side i.e., border-t-green-100 for a light green top border
    plugin(({ addUtilities, theme }) => {
      const colors = flattenColorPalette(theme('colors'))
      delete colors['default']

      const colorMap = Object.keys(colors).map((color) => ({
        [`.border-t-${color}`]: { borderTopColor: colors[color] },
        [`.border-r-${color}`]: { borderRightColor: colors[color] },
        [`.border-b-${color}`]: { borderBottomColor: colors[color] },
        [`.border-l-${color}`]: { borderLeftColor: colors[color] },
      }))
      const utilities = Object.assign({}, ...colorMap)

      addUtilities(utilities, ['responsive', 'hover'])
    }),
  ],
  variants: {
    extend: {
      borderRadius: ['first', 'last'],
    },
  },
}
