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
        as="style"
        rel="preload"
        href="https://fonts.cdnfonts.com/css/open-sans"
      />
      <link href="https://fonts.cdnfonts.com/css/open-sans" rel="stylesheet" />
    </Head>
  )
}
