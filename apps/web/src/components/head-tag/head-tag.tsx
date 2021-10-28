import Head from 'next/head'
import useTranslation from 'next-translate/useTranslation'

export interface HeadTagProps {
  pageDescription?: string
  pageTitle?: string
}

export default function HeadTag({ pageDescription, pageTitle }: HeadTagProps) {
  const { t } = useTranslation()

  return (
    <Head>
      <title>
        {pageTitle
          ? `${pageTitle} - ${t('common:global.pageTitle')}`
          : t('common:global.pageTitle')}
      </title>
      <meta
        name="description"
        content={pageDescription ?? t('common:global.pageDescription')}
      />
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/favicon-180.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* Base Fonts */}
      <link
        as="style"
        rel="preload"
        href="https://fonts.cdnfonts.com/css/inter"
      />
      <link href="https://fonts.cdnfonts.com/css/inter" rel="stylesheet" />
    </Head>
  )
}
