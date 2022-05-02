import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import React from 'react'

import css from './not-authorized.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'
import { urls } from '@/utils/urls'

export default function NotAuthorized() {
  const { t } = useTranslation()

  return (
    <>
      <Heading level={1} className={css.heading}>
        {t('auth:Not Authorized')}
      </Heading>
      <Trans
        components={[
          <p className="px-4 mb-12 text-center" key={0} />,
          <AppLink key={1} href={urls.home} />,
          <AppLink key={2} href={urls.releases} />,
        ]}
        i18nKey="common:global.401.body"
      />
    </>
  )
}
