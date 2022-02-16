import { MenuIcon, UserCircleIcon, XIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import Image from 'next/image'
import { useRouter } from 'next/router'
import useTranslation from 'next-translate/useTranslation'
import { useCallback, useState } from 'react'

import css from './app-header.module.css'

import AppLink from '@/components/app-link/app-link'
import Button from '@/components/button'
import Logo from '@/components/logo/logo'
import { useAuth } from '@/contexts/auth-context'
import { getMainNavItems } from '@/utils/navigation'
import { isRootPathMatch, urls } from '@/utils/urls'

export default function AppHeader() {
  const auth = useAuth()
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const { t } = useTranslation()
  const navItems = getMainNavItems(t)
  const { pathname, push } = useRouter()

  const isAuthenticated = auth.status === 'authenticated'
  const signOut = useCallback(async () => {
    await auth.signOut()
    push(urls.home)
  }, [auth, push])

  const signIn = () => {
    setShowMenu(false)
    push(urls.login)
  }

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
              className={showMenu ? css.hamburgerMenuOpen : css.hamburger}
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
            {isAuthenticated ? (
              <>
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
              </>
            ) : (
              <>
                <AppLink className={css.utilityNavLink} href={urls.login}>
                  <span className="hidden md:inline">
                    {t('common:actions.Sign In')}
                  </span>
                  <UserCircleIcon
                    className={`${css.avatarGeneric} md:hidden`}
                    height={40}
                    width={40}
                  />
                </AppLink>
                <Button
                  size="small"
                  className="md:inline hidden"
                  onClick={signIn}
                >
                  Create Account
                </Button>
              </>
            )}
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
          <div className={css.mainNavItems}>
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
          <div className={css.mobileNavBottom}>
            {isAuthenticated ? (
              <>
                <AppLink href={urls.settings}>
                  {t('common:nav.main.Settings')}
                </AppLink>
                <AppLink href="#" onClick={signOut}>
                  {t('common:actions.Sign Out')}
                </AppLink>
              </>
            ) : (
              <>
                <Button onClick={signIn}>
                  {t('common:actions.Create Account')}
                </Button>
                <Button variant="secondary" onClick={signIn}>
                  {t('common:actions.Sign In')}
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
