import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import React from 'react'

import css from './app-footer-top-nav.module.css'

import AppLink from '@/components/app-link/app-link'
import ExternalLink from '@/components/external-link'
import Logo from '@/components/logo/logo'
import {
  getMainNavItems,
  getMoreNavItems,
  getSocialNavItems,
} from '@/utils/navigation'
import { isRootPathMatch } from '@/utils/urls'

export default function AppFooterTopNav() {
  const { t } = useTranslation()
  const mainNavItems = getMainNavItems(t)
  const moreNavItems = getMoreNavItems(t)
  const socialNavItems = getSocialNavItems(t)

  const { pathname } = useRouter()

  return (
    <section className={css.topNav}>
      <div className={css.topNavWrapper}>
        <Logo />

        <div className={css.topNavNavWrapper}>
          <nav
            aria-label={t('common:nav.headings.FIFA NFT')}
            className={css.topNavNav}
          >
            <h3>{t('common:nav.headings.FIFA NFT')}</h3>
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
          </nav>
          <nav
            aria-label={t('common:nav.headings.MORE')}
            className={css.topNavNav}
          >
            <h3>{t('common:nav.headings.MORE')}</h3>
            {moreNavItems.map(({ href, label }) => {
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
          </nav>
        </div>
        <nav
          aria-label={t('common:nav.aria.Social Media')}
          className={css.topNavSocialMediaSpace}
        >
          {socialNavItems.map(({ href, label, icon }) => (
            <ExternalLink
              className={css.topNavSocialMediaLinks}
              key={label}
              href={href}
              target="_blank"
            >
              {icon ? (
                <Image width={28} height={28} src={icon} alt={label} />
              ) : (
                label
              )}
            </ExternalLink>
          ))}
        </nav>
      </div>
    </section>
  )
}
