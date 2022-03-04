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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
