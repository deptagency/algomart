import { MenuIcon, UserCircleIcon, XIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useState } from 'react'

import css from './app-header.module.css'

import AppLink from '@/components/app-link/app-link'
import Logo from '@/components/logo/logo'
import { useAuth } from '@/contexts/auth-context'
import { getMainNavItems } from '@/utils/navigation'
import { isRootPathMatch, urls } from '@/utils/urls'

export default function AppHeader() {
  const auth = useAuth()
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const { t } = useTranslation()
  const navItems = getMainNavItems(t)
  const { pathname } = useRouter()

  const isAuthenticated = auth.status === 'authenticated'

  return (
    <header
      className={clsx(css.root, {
        [css.rootMobileVisible]: showMenu,
      })}
    >
      <div className={css.utilityWrapper}>
        <div className={css.utility}>
          <div className={css.hamburgerWrapper}>
            <button
              className={css.hamburger}
              onClick={() => {
                setShowMenu(!showMenu)
              }}
            >
              {showMenu ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
          <div className={css.logo}>
            <Logo />
          </div>
          <div className={css.utilityNav}>
            <AppLink
              aria-label={
                isAuthenticated
                  ? t('common:pageTitles.My Profile')
                  : t('common:nav.utility.Log In')
              }
              className={css.utilityNavLink}
              href={isAuthenticated ? urls.myProfile : urls.login}
              title={
                isAuthenticated
                  ? t('common:pageTitles.My Profile')
                  : t('common:nav.utility.Log In')
              }
            >
              <div className={css.utilityNavLabel}>
                {t('common:nav.utility.My Account')}
              </div>
              {auth.user?.photo ? (
                <Image
                  alt={t('common:nav.utility.My profile picture')}
                  src={auth.user.photo}
                  layout="fixed"
                  height={40}
                  width={40}
                />
              ) : (
                <UserCircleIcon
                  className={css.avatarGeneric}
                  height={40}
                  width={40}
                />
              )}
            </AppLink>
          </div>
        </div>
      </div>
      <nav
        aria-label={t('common:nav.aria.Main Navigation')}
        className={css.wrapper}
      >
        {/* Main Nav */}
        <div
          className={clsx(css.mainNav, {
            [css.mainNavHidden]: !showMenu,
          })}
        >
          {navItems.map(({ href, label }) => {
            const isCurrentNavItem = isRootPathMatch(pathname, href)
            return (
              <AppLink
                className={clsx(css.mainNavLink, {
                  [css.mainNavLinkActive]: isCurrentNavItem,
                })}
                href={href}
                onClick={() => setShowMenu(false)}
                key={href}
              >
                {label}
              </AppLink>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
