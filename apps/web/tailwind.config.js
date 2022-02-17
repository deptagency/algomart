/* eslint-disable @typescript-eslint/no-var-requires */
const flattenColorPalette =
  require('tailwindcss/lib/util/flattenColorPalette').default
const plugin = require('tailwindcss/plugin')
const { createGlobPatternsForDependencies } = require('@nrwl/react/tailwind')
const path = require('path')

const generateColorClass = (variable) => {
  return ({ opacityValue }) =>
    opacityValue
      ? `rgba(var(--${variable}), ${opacityValue})`
      : `rgb(var(--${variable}))`
}

module.exports = {
  // tree-shaking unused styles
  content: [
    path.join(__dirname, 'src', '**', '*.{js,ts,jsx,tsx,css}'),
    ...createGlobPatternsForDependencies(__dirname, '**/*.{js,ts,jsx,tsx,css}'),
  ],

  darkMode: false, // or false, 'media' or 'class'
  theme: {
    fontFamily: {
      base: ['"Open Sans"', 'ui-sans-serif', 'system-ui', '-apple-system'],
      display: ['"Open Sans Condensed"', 'ui-sans-serif', 'system-ui'],
      mono: [
        'ui-monospace',
        'SFMono-Regular',
        'Menlo',
        'Monaco',
        'Consolas',
        '"Liberation Mono"',
        '"Courier New"',
        'monospace',
      ],
    },
    fontSize: {
      xs: '.75rem',
      sm: '.875rem',
      base: '1rem',
      lg: '1.25rem',
      xl: '1.75rem',
      '2xl': '2.5rem',
      '3xl': '4rem',
      '4xl': '5rem',
      '5xl': '6rem',
      '6xl': '7rem',
      '7xl': '8rem',
    },
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
        action: {
          primary: generateColorClass('actionPrimary'),
          primaryContrastText: generateColorClass('actionPrimaryContrastText'),
          secondary: generateColorClass('actionSecondary'),
          secondaryContrastText: generateColorClass(
            'actionSecondaryContrastText'
          ),
          accent: generateColorClass('actionAccent'),
        },
        base: {
          error: generateColorClass('error'),
          price: generateColorClass('price'),
          border: generateColorClass('border'),

          bg: generateColorClass('bg'),
          bgCard: generateColorClass('bgCard'),
          bgPanel: generateColorClass('bgPanel'),
          bgNotice: generateColorClass('bgNotice'),

          textPrimary: generateColorClass('textPrimary'),
          textSecondary: generateColorClass('textSecondary'),
          textTertiary: generateColorClass('textTertiary'),
          textDisabled: generateColorClass('textDisabled'),

          // DEPRECATED
          gray: {
            dark: generateColorClass('grayDark'),
            medium: '#747F8F',
            light: '#B6BECB',
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
      const colorMap = Object.keys(colors).map((colorName) => {
        const color =
          typeof colors[colorName] === 'function'
            ? colors[colorName](colorName)
            : colors[colorName]
        return {
          [`.border-t-${colorName}`]: { borderTopColor: color },
          [`.border-r-${colorName}`]: { borderRightColor: color },
          [`.border-b-${colorName}`]: { borderBottomColor: color },
          [`.border-l-${colorName}`]: { borderLeftColor: color },
        }
      })
      const utilities = Object.assign({}, ...colorMap)

      addUtilities(utilities, ['responsive', 'hover'])
    }),
  ],
}
