import useTranslation from 'next-translate/useTranslation'

import css from './not-authenticated.module.css'

import AppLink from '@/components/app-link/app-link'
import { H1 } from '@/components/heading'
import { urls } from '@/utils/urls'

export default function NotAuthenticated() {
  const { t } = useTranslation()
  return (
    <div className="my-12">
      <H1 mb={6} center>
        {t('auth:Not Authenticated')}
      </H1>
      <p className={css.body}>
        <AppLink href={urls.loginEmail}>
          {t('auth:You must first login to view the profile page')}
        </AppLink>
      </p>
    </div>
  )
}
