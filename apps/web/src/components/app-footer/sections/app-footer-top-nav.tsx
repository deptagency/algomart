import clsx from 'clsx'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React from 'react'

import css from './app-footer-top-nav.module.css'

import AppLink from '@/components/app-link/app-link'
import ExternalLink from '@/components/external-link'
import { getMainNavItems, getSocialNavItems } from '@/utils/navigation'
import { isRootPathMatch } from '@/utils/urls'

export default function AppFooterTopNav() {
  const { t } = useTranslation()
  const mainNavItems = getMainNavItems(t)
  const socialNavItems = getSocialNavItems(t)

  const { pathname } = useRouter()

  return (
    <section className={css.topNav}>
      <nav
        aria-label={t('common:nav.aria.Main Navigation')}
        className={css.topNavWrapper}
      >
        {mainNavItems.map(({ href, label }) => {
          const isCurrentNavItem = isRootPathMatch(pathname, href)
          return (
            <AppLink
              className={clsx(css.topNavLink, {
                [css.topNavLinkActive]: isCurrentNavItem,
              })}
              href={href}
              key={href}
            >
              {label}
            </AppLink>
          )
        })}
      </nav>{' '}
      <nav
        aria-label={t('common:nav.aria.Social Media')}
        className={css.topNavSocialMediaSpace}
      >
        {socialNavItems.map(({ href, label }) => (
          <ExternalLink
            className={css.topNavSocialMediaLinks}
            key={label}
            href={href}
            target="_blank"
          >
            {label}
          </ExternalLink>
        ))}
      </nav>
    </section>
  )
}
