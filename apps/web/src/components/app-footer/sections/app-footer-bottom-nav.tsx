import Link from 'next/link'
import useTranslation from 'next-translate/useTranslation'

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
            {legalNavItems.map(({ href, label }) =>
              href ? (
                <Link href={href}>
                  <a className={css.bottomNavLinks} key={label}>
                    {label}
                  </a>
                </Link>
              ) : (
                <span className={css.bottomNavLinks} key={label}>
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
        </div>
      </div>
    </section>
  )
}
