module.exports = {
  defaultLocale: 'en-US',
  locales: ['en-US'],
  pages: {
    '*': ['auth', 'collection', 'common', 'forms'],
    '/': ['release'],
    'rgx:/asset': ['asset'],
    'rgx:/my/profile': ['profile'],
    'rgx:/releases': ['release'],
    '/checkout': ['release'],
  },
  // Needed to dynamically load locales within APIs using `getT()`
  // https://github.com/vinissimus/next-translate/issues/484#issuecomment-899593712
  loadLocaleFrom: (lang, ns) =>
    import(`./locales/${lang}/${ns}.json`).then((m) => m.default),
}
