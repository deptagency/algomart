import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'
import { urls } from '@/utils/urls'

export default function Custom404Template() {
  const { t } = useTranslation()

  return (
    <>
      <Heading className="px-4 mb-4 text-center">
        {t('common:global.404.title')}
      </Heading>
      <Trans
        components={[
          <p className="px-4 mb-12 text-center" key={0} />,
          <AppLink key={1} href={urls.home} />,
          <AppLink key={2} href={urls.releases} />,
        ]}
        i18nKey="common:global.404.body"
      />
    </>
  )
}
