import Link from 'next/link'
import useTranslation from 'next-translate/useTranslation'

import AppFooterCurrency from './app-footer-currency'
import AppFooterLanguage from './app-footer-language'

import css from './app-footer-bottom-nav.module.css'

import { getLegalNavItems } from '@/utils/navigation'

export default function AppFooterBottomNav() {
  const { t } = useTranslation()
  const legalNavItems = getLegalNavItems(t)

  return (
    <section className={css.bottomNav}>
      <div className={css.bottomNavWrapper}>
        <div className={css.bottomNavLeft}>
          <nav aria-label={t('common:nav.aria.Legal')}>
            {legalNavItems.map(({ href, label }, index) =>
              href ? (
                <Link key={`footer-bottom-nav-${index}`} href={href}>
                  <a className={css.bottomNavLinks}>{label}</a>
                </Link>
              ) : (
                <span
                  key={`footer-bottom-nav-${index}`}
                  className={css.bottomNavLinks}
                >
                  {label}
                </span>
              )
            )}
          </nav>
          <div>{t('common:nav.legal.copyright')}</div>
          <div>{t('common:nav.legal.Cookie Settings')}</div>
        </div>
        <div className={css.bottomNavSpace}>
          <AppFooterLanguage />
          <AppFooterCurrency />
        </div>
      </div>
    </section>
  )
}
