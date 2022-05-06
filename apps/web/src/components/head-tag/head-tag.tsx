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
    </Head>
  )
}
