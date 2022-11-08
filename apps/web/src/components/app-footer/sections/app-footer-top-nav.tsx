import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'

import AppFooterCurrency from './app-footer-currency'
import AppFooterLanguage from './app-footer-language'

import css from './app-footer-top-nav.module.css'

import AppLink from '@/components/app-link/app-link'
import ExternalLink from '@/components/external-link'
import Logo from '@/components/logo/logo'
import {
  getFooterNavItems,
  getMoreNavItems,
  getSocialNavItems,
} from '@/utils/navigation'
import { isSubPath } from '@/utils/urls'

export default function AppFooterTopNav() {
  const { t } = useTranslation()
  const mainNavItems = getFooterNavItems(t)
  const moreNavItems = getMoreNavItems(t)
  const socialNavItems = getSocialNavItems(t)
  const { asPath } = useRouter()

  return (
    <section className={css.topNav}>
      <div className={css.topNavWrapper}>
        <div className={css.topNavLeft}>
          <Logo className={css.footerLogo} />
          <div className={css.topNavLeftWrapper}>
            <nav
              aria-label={t('common:nav.headings.INFO')}
              className={css.topNavLeftNav}
            >
              <h3>{t('common:nav.headings.INFO')}</h3>
              {mainNavItems.map(({ href, label }) => {
                const isCurrentNavItem = isSubPath(asPath, href, [
                  'profile',
                  'wallet',
                ])
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
            <nav className={css.topNavLeftNav}>
              {moreNavItems.map(({ href, label }) => {
                const isCurrentNavItem = isSubPath(asPath, href)
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
        </div>

        <div className={css.topNavRight}>
          <div className={css.userPreferences}>
            <AppFooterLanguage />
            <AppFooterCurrency />
          </div>
          <nav
            aria-label={t('common:nav.aria.Social Media')}
            className={css.topNavSocialMediaSpace}
          >
            {socialNavItems.map(({ href, label, icon }) => (
              <ExternalLink
                className={css.topNavSocialMediaLink}
                key={label}
                href={href}
              >
                <Image width={28} height={28} src={icon} alt={label} />
              </ExternalLink>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
