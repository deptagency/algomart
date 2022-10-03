/** @type {import('next-translate').I18nConfig} */
module.exports = {
  //-----------------------------------------------------------------------------
  // THIS MUST MATCH DEFAULT_LOCALE CONST
  defaultLocale: 'en-UK',

  //-----------------------------------------------------------------------------
  // THIS MUST MATCH SUPPORTED_LANGUAGES CONST + 'en-US' for development Also,
  //
  // Please also ensure 'docker/deploy/web/run.sh' reflects the new language
  // set. A different set of pages will need to be flushed from the ISR cache on
  // production boot.
  locales: ['en-US', 'en-UK', 'es-ES', 'fr-FR'],

  pages: {
    '*': ['auth', 'collection', 'common', 'forms', 'home', 'release'],
    'rgx:/drops': ['drops', 'nft'],
    'rgx:/marketplace': ['drops', 'nft'],
    'rgx:/asset': ['asset'],
    'rgx:/my/profile': ['profile', 'nft'],
    'rgx:/nft': ['nft'],
    'rgx:/checkout': ['nft'],
  },
  // Needed to dynamically load languages within APIs using `getT()`
  // https://github.com/vinissimus/next-translate/issues/484#issuecomment-899593712
  loadLocaleFrom: async (lang, ns) => {
    // NOTE: To support dev being in 'en-US', manually switch the language code
    if (process.env.NODE_ENV !== 'production' && lang === 'en-UK') {
      lang = 'en-US'
    }

    if (process.env.NODE_ENV === 'production' && lang === 'en-US') {
      lang = 'en-UK'
    }

    /// Note: still a bug with using `import(...).then(...)`
    return require(`./languages/${lang}/${ns}.json`)
  },
}
