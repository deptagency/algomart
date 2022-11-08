/* eslint-disable @typescript-eslint/no-var-requires */
const flattenColorPalette =
  require('tailwindcss/lib/util/flattenColorPalette').default
const plugin = require('tailwindcss/plugin')
const { createGlobPatternsForDependencies } = require('@nrwl/react/tailwind')
/* eslint-disable-next-line unicorn/prefer-node-protocol */
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
  // classes not to prune
  // <Heading> interpolates these margins so they can't be pruned.
  safelist: [
    'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8', 'mb-10', 'mb-12', 'mb-16',
    'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8', 'mt-10', 'mt-12', 'mt-16',
    'my-1', 'my-2', 'my-3', 'my-4', 'my-5', 'my-6', 'my-8', 'my-10', 'my-12', 'my-16',
  ],
  theme: {
    fontFamily: {
      base: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system'],
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
      lg: '1.125rem',
      xl: '1.75rem',
      '2xl': '2.5rem',
      '3xl': '3rem',
      '4xl': '4rem',
      '5xl': '5rem',
      '6xl': '6rem',
      '7xl': '7rem',
    },
    extend: {
      backgroundImage: {
        'pack-texture': "url('/images/textures/pack-texture.jpg')",
        'pack-listing-mobile-1x': "url('/images/pack-listing/mobile@1x.webp')",
        'pack-listing-mobile-2x': "url('/images/pack-listing/mobile@2x.webp')",
        'pack-listing-desktop-1x': "url('/images/pack-listing/desktop@1x.webp')",
        'pack-listing-desktop-2x': "url('/images/pack-listing/desktop@2x.webp')"
      },
      borderColor: {
        DEFAULT: generateColorClass('border'),
      },
      borderRadius: {
        sm: '4px',
      },
      borderWidth: {
        1: '1px',
        6: '6px',
        20: '20px',
      },
      colors: {
        midnight: generateColorClass('midnight'),
        blue: {
          200: generateColorClass('blue200'),
          300: generateColorClass('blue300'),
          500: generateColorClass('blue500'),
        },
        pink: generateColorClass('pink'),
        pinkDark: generateColorClass('pinkDark'),
        teal: generateColorClass('teal'),
        yellow: generateColorClass('yellow'),
        green: generateColorClass('green'),
        purple: generateColorClass('purple'),
        skyBlue: generateColorClass('skyBlue'),
        action: {
          accent: generateColorClass('actionAccent'),
          link: generateColorClass('actionLink'),
          linkHover: generateColorClass('actionLinkHover'),
          primary: generateColorClass('actionPrimary'),
          primaryHover: generateColorClass('actionPrimaryHover'),
          primaryContrastText: generateColorClass('actionPrimaryContrastText'),
          secondary: generateColorClass('actionSecondary'),
          secondaryHover: generateColorClass('actionSecondaryHover'),
          secondaryContrastText: generateColorClass('actionSecondaryContrastText'),
          tertiary: generateColorClass('actionTertiary'),
          tertiaryHover: generateColorClass('actionTertiaryHover'),
          tertiaryContrastText: generateColorClass('actionTertiaryContrastText'),
          disabled: generateColorClass('actionDisabled'),
          disabledContrastText: generateColorClass('actionDisabledContrastText'),
        },
        base: {
          error: generateColorClass('error'),
          warn: generateColorClass('warn'),
          price: generateColorClass('price'),
          border: generateColorClass('border'),
          borderInput: generateColorClass('borderInput'),
          borderPrimary: generateColorClass('borderPrimary'),

          bg: generateColorClass('bg'),
          bgCard: generateColorClass('bgCard'),

          textPrimary: generateColorClass('textPrimary'),
          textSecondary: generateColorClass('textSecondary'),
          textTertiary: generateColorClass('textTertiary'),
          textDisabled: generateColorClass('textDisabled'),
          textWarn: generateColorClass('textWarn'),
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
        210: '210px',
        520: '520px',
        700: '700px',
        960: '960px',
        wrapper: '1200px',
      },
      screens: {
        mdlg: '960px',
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
    function ({ addUtilities }) {
      addUtilities({
        // Normally you'd put utility classes in a @layer but
        // nextjs doesn't play well with this so we do it here.
        '.bg-blue-gradient-horz': {
          backgroundImage: 'linear-gradient(90deg, #00B8FF 0%, #0A84FF 100%)'
        },
        '.bg-blue-gradient-vert': {
          backgroundImage: 'linear-gradient(180deg, #00B8FF 0%, #0A84FF 100%)'
        },
        '.border-rainbow': {
          borderImage: 'var(--rainbowGradient)',
          borderImageSlice: '1',
        },
        '.bg-rainbow': {
          backgroundImage: 'var(--rainbowGradient)',
        }
      })
    },
  ],
}
