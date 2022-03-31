import { Head, Html, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Base Fonts */}
        <link
          as="style"
          rel="preload"
          href="https://fonts.cdnfonts.com/css/inter"
        />
        <link href="https://fonts.cdnfonts.com/css/inter" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon-180.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
