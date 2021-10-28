import useTranslation from 'next-translate/useTranslation'

import DefaultLayout from '@/layouts/default-layout'
import Custom404Template from '@/templates/404-template'

export default function Custom404Page() {
  const { t } = useTranslation()
  return (
    <DefaultLayout pageTitle={t('common:pageTitles.404')}>
      <Custom404Template />
    </DefaultLayout>
  )
}
