const {
  DEFAULT_LANG,
  SUPPORTED_LANGUAGES,
} = require('../../libs/schemas/src/language-consts')

module.exports = {
  defaultLocale: DEFAULT_LANG,
  locales: SUPPORTED_LANGUAGES,
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
