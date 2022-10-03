import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import AppLink from '@/components/app-link/app-link'
import { H1 } from '@/components/heading'
import { urls } from '@/utils/urls'

export default function Custom404Template() {
  const { t } = useTranslation()

  return (
    <>
      <H1 center mb={4} className="px-4">
        {t('common:global.404.title')}
      </H1>
      <Trans
        components={[
          <p className="px-4 mb-12 text-center" key={0} />,
          <AppLink key={1} href={urls.home} />,
          <AppLink key={2} href={urls.drops} />,
        ]}
        i18nKey="common:global.404.body"
      />
    </>
  )
}
