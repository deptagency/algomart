// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    tailwindcss: { config: './apps/web/tailwind.config.js' },
    autoprefixer: {},
  },
}
