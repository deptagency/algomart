/* eslint-disable @typescript-eslint/no-var-requires */
const flattenColorPalette =
  require('tailwindcss/lib/util/flattenColorPalette').default
const plugin = require('tailwindcss/plugin')

const colors = require('tailwindcss/colors')

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
        '2.5xl': '1.1rem',
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
        purple: {
          600: '#9757D7',
        },
        indigo: {
          600: '#3772FF',
        },
        green: {
          600: '#45B26B',
        },
        blue: {
          400: '#68D7FF',
          600: '#00B0F0',
          800: '#309AC0',
        },
        pink: {
          400: '#309AC0',
          600: '#EF466F', // Primary Buttons
        },
        gray: {
          50: '#FCFCFD', // Icons/Typography
          100: '#E6E8EC', // Pill Active - Follow Page
          200: '#B1B5C3', // Typography "Creator"
          400: '#777E90', // Icons/Typography
          600: '#353945', // Pill Buttons/Borders
          800: '#23262F', // Favorite Button
          900: '#090B16', // Background
        },
        base: {
          errorRed: '#AC0000',
          green: '#02FBC2',
          priceGreen: '#33C500',
          teal: '#12DCC5',
          gray: {
            dark: colors.gray['500'],
            text: colors.coolGray['50'],
            nav: '#e5e5e5',
            notice: '#F9F8F9',
            medium: '#747F8F',
            light: '#B6BECB',
            border: '#DADCDF',
            bg: '#ECECEC',
          },
        },
      },
      fontFamily: {
        poppins: [
          'Poppins',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        'dm-sans': [
          'DM Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
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
