import Image from 'next/image'
import useTranslation from 'next-translate/useTranslation'

import css from './app-footer-bottom-nav.module.css'

import AppLink from '@/components/app-link/app-link'
import { AppConfig } from '@/config'
import { getLegalNavItems } from '@/utils/navigation'

export default function AppFooterBottomNav() {
  const { t } = useTranslation()
  const legalNavItems = getLegalNavItems(t)
  const year = new Date().getFullYear()

  return (
    <section className={css.bottomNav}>
      <div className={css.bottomNavWrapper}>
        <div className={css.bottomNavLeft}>
          <nav aria-label={t('common:nav.aria.Legal')}>
            {legalNavItems.map(({ href, label }, index) =>
              href ? (
                <AppLink
                  key={`footer-bottom-nav-${index}`}
                  href={href}
                  className={css.bottomNavLinks}
                >
                  {label}
                </AppLink>
              ) : (
                <span
                  key={`footer-bottom-nav-${index}`}
                  className={css.bottomNavLinks}
                >
                  {label}
                </span>
              )
            )}
            <div>{t('common:nav.legal.copyright', { year })}</div>

            <div title={AppConfig.githubSHA}>
              {t('common:nav.legal.Version')}{' '}
              {AppConfig.githubRefName || AppConfig.githubSHA}
            </div>
          </nav>
        </div>
        <div className={css.bottomNavRight}>
          <div>{t('common:nav.legal.Powered by')}</div>
          <div>
            <Image
              alt="Algorand"
              height={30}
              layout="intrinsic"
              src="/images/logos/algorand.svg"
              width={88}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
