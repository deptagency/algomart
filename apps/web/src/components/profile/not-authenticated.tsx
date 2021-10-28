import useTranslation from 'next-translate/useTranslation'

import css from './not-authenticated.module.css'

import AppLink from '@/components/app-link/app-link'
import Heading from '@/components/heading'
import { urls } from '@/utils/urls'

export default function NotAuthenticated() {
  const { t } = useTranslation()
  return (
    <>
      <Heading level={1} className={css.heading}>
        {t('auth:Not Authenticated')}
      </Heading>
      <p className={css.body}>
        <AppLink href={urls.login}>
          {t('auth:You must first login to view the profile page')}
        </AppLink>
      </p>
    </>
  )
}
