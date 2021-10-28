import useTranslation from 'next-translate/useTranslation'

import css from './app-footer-bottom-nav.module.css'

import ExternalLink from '@/components/external-link'
import Logo from '@/components/logo/logo'
import { getLegalNavItems, getSocialNavItems } from '@/utils/navigation'

export default function AppFooterBottomNav() {
  const { t } = useTranslation()
  const socialNavItems = getSocialNavItems(t)
  const legalNavItems = getLegalNavItems(t)

  return (
    <section className={css.bottomNav}>
      <div className={css.bottomNavWrapper}>
        <div className={css.bottomNavLeft}>
          <Logo
            color={'black'}
            className={css.bottomNavLeftImage}
            layout="fixed"
          />
          <nav
            aria-label={t('common:nav.aria.Social Media')}
            className={css.bottomNavSpace}
          >
            {socialNavItems.map(({ href, label }) => (
              <ExternalLink
                className={css.bottomNavLinks}
                key={label}
                href={href}
                target="_blank"
              >
                {label}
              </ExternalLink>
            ))}
          </nav>
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
        </nav>
      </div>
    </section>
  )
}
