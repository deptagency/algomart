import Trans from 'next-translate/Trans'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useEffect, useState } from 'react'

import css from './cookie-consent.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import { getCookie, setCookie } from '@/utils/cookies-web'
import { urls } from '@/utils/urls'

const CONSENT_COOKIE = 'cookie-consent'

export default function CookieConsent() {
  const [cookieValue, setCookieValue] = useState('')
  const [hasAccepted, setHasAccepted] = useState(!cookieValue)
  const { t } = useTranslation()

  const handleAccept = useCallback(() => {
    setCookie(CONSENT_COOKIE, '1', 365)
    setHasAccepted(true)
  }, [])

  useEffect(() => {
    const newValue = getCookie(CONSENT_COOKIE)
    setCookieValue(newValue)
    setHasAccepted(!!newValue)
  }, [])

  if (hasAccepted) return null

  return (
    <div className={css.root}>
      <div className={css.wrapper}>
        <div>
          <Trans
            components={[
              <p key={0} />,
              <p key={1} />,
              <AppLink key={2} href={urls.termsAndConditions} />,
              <AppLink key={3} href={urls.privacyPolicy} />,
            ]}
            i18nKey="common:global.consent"
          />
        </div>
        <div className={css.acceptButton}>
          <Button onClick={handleAccept}>{t('common:actions.Accept')}</Button>
        </div>
      </div>
    </div>
  )
}
