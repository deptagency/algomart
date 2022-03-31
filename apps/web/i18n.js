module.exports = {
  defaultLocale: 'en-US', // THIS MUST MATCH DEFAULT_LOCALE CONST
  locales: ['ar', 'en-US', 'fr-FR', 'es-ES'], // THIS MUST MATCH SUPPORTED_LANGUAGES CONST
  pages: {
    '*': ['admin', 'auth', 'collection', 'common', 'forms', 'release'],
    'rgx:/asset': ['asset'],
    'rgx:/my/profile': ['profile', 'nft'],
    'rgx:/nft': ['nft'],
  },
  // Needed to dynamically load locales within APIs using `getT()`
  // https://github.com/vinissimus/next-translate/issues/484#issuecomment-899593712
  loadLocaleFrom: (lang, ns) =>
    import(`./languages/${lang}/${ns}.json`).then((m) => m.default),
}
