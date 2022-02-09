import useTranslation from 'next-translate/useTranslation'

import AppFooterCurrency from './app-footer-currency'
import AppFooterLanguage from './app-footer-language'

import css from './app-footer-bottom-nav.module.css'

import ExternalLink from '@/components/external-link'
import Logo from '@/components/logo/logo'
import { getLegalNavItems } from '@/utils/navigation'

export default function AppFooterBottomNav() {
  const { t } = useTranslation()
  const legalNavItems = getLegalNavItems(t)

  return (
    <section className={css.bottomNav}>
      <div className={css.bottomNavWrapper}>
        <div className={css.bottomNavLeft}>
          <Logo className={css.bottomNavLeftImage} />
        </div>
        <nav
          aria-label={t('common:nav.aria.Legal')}
          className={css.bottomNavSpace}
        >
          {legalNavItems.map(({ href, label }) =>
            href ? (
              <ExternalLink
                className={css.bottomNavLinks}
                key={label}
                href={href}
                target="_blank"
              >
                {label}
              </ExternalLink>
            ) : (
              <span className={css.bottomNavLinks} key={label}>
                {label}
              </span>
            )
          )}
          <AppFooterLanguage />
          <AppFooterCurrency />
        </nav>
      </div>
    </section>
  )
}
