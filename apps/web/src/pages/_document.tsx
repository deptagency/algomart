import { DEFAULT_LANG, RTL_LANGUAGES } from '@algomart/schemas'
import Document, { Head, Html, Main, NextScript } from 'next/document'

function getLanguageDirection(language: string) {
  return RTL_LANGUAGES.includes(language?.split('-')[0] ?? DEFAULT_LANG)
    ? 'rtl'
    : 'ltr'
}

class MyDocument extends Document {
  render() {
    return (
      <Html dir={getLanguageDirection(this.props.locale)}>
        <Head>
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/manifest.json" />

          {/* Base Fonts */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap"
            rel="stylesheet"
          />

          {/* load runtime config as JS blob */}
          {/* eslint-disable-next-line @next/next/no-sync-scripts */}
          <script src="/api/config" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
